/**
 * Claude Code JSONL Session Parser
 *
 * Parses Claude Code session files (~/.claude/projects/<path>/<session>.jsonl)
 * into a structured format suitable for import into Klatch channels.
 *
 * Key design decisions:
 * - Store everything, display selectively (full fidelity in DB, collapsed in UI)
 * - Skip progress, file-history-snapshot, queue-operation events
 * - Skip prompt_suggestion subagent events entirely
 * - Extract compaction summaries from acompact-* subagent events
 * - Group by turns: each human-typed user message starts a new turn (not parentUuid=null)
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import fs from 'fs';

// ── Raw JSONL event types ─────────────────────────────────────

export interface RawContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'image';
  // text block
  text?: string;
  // tool_use block
  id?: string;
  name?: string;
  input?: Record<string, any>;
  // tool_result block
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
  // image block
  source?: { type: string; media_type: string; data: string };
  // thinking block
  thinking?: string;
}

export interface RawEvent {
  type: string; // "user" | "assistant" | "system" | "progress" | "file-history-snapshot" | "queue-operation"
  uuid: string;
  parentUuid: string | null;
  sessionId?: string;
  timestamp: string;
  isSidechain?: boolean;
  agentId?: string;
  slug?: string;
  cwd?: string;
  version?: string;
  gitBranch?: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | RawContentBlock[];
    model?: string;
    id?: string;
    stop_reason?: string | null;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  toolUseResult?: string;
  // Injection metadata — see docs/JSONL-SCHEMA.md for full taxonomy
  isMeta?: boolean;                  // true for hook feedback, skill injections, image references
  isCompactSummary?: boolean;        // true for compaction context injections
  isVisibleInTranscriptOnly?: boolean; // also true for compaction summaries
  permissionMode?: string;           // "default" | "acceptEdits" — present on real human messages
  sourceToolAssistantUUID?: string;  // present on tool results
  sourceToolUseID?: string;          // present on skill/command injections
  // System event fields
  subtype?: string;                  // "compact_boundary" | "stop_hook_summary" | "api_error"
  compactMetadata?: { trigger?: string; preTokens?: number };
  logicalParentUuid?: string;        // preserves chain identity across compaction boundaries
}

// ── Parsed output types ───────────────────────────────────────

export interface ParsedArtifact {
  type: string;         // 'tool_use' | 'tool_result' | 'thinking' | 'image'
  toolName: string;     // tool name (e.g., "Read", "Bash") or type label for non-tool
  inputSummary: string; // human-readable summary (e.g., "src/App.tsx")
  content?: string;     // full JSON or text content for DB storage
}

export interface ParsedTurn {
  userText: string;
  assistantText: string;
  timestamp: string;        // ISO timestamp of the root user event
  originalId: string;       // uuid of root user event
  /**
   * Timestamp and uuid of the LAST assistant event in the turn. Both messages used to be
   * stamped with the user's values, so in a session spanning days an answer written hours
   * after the question displayed the question's clock time, and original_id was not a
   * message identity (both rows shared one), which blocks any future merge or dedup.
   * Optional so older callers and fixtures keep working.
   */
  assistantTimestamp?: string;
  assistantOriginalId?: string;
  model?: string;           // model used for assistant response
  artifacts?: ParsedArtifact[];
}

/**
 * Import integrity receipt. Every silent-failure path in the parser should end
 * up as a visible number here, so that a Claude Code format change surfaces as
 * a suspicious count rather than as a quietly thinner conversation.
 */
export interface ImportIntegrity {
  eventCount: number;                          // raw JSONL events read
  conversationEvents: number;                  // survived isConversationEvent()
  turnsEmitted: number;
  skippedLines: number;                        // malformed JSONL lines
  injectedUserEventsFiltered: number;          // user events rejected as non-human
  unrecognizedEventTypes: Record<string, number>;
  versionsSeen: string[];
  boundaryMode: 'permissionMode' | 'legacy-flags';
  /**
   * Tree shape, reported rather than acted on. Turn grouping is a flat timestamp sort;
   * parentUuid is not walked. That is a deliberate freeze decision, not an oversight —
   * the flat sort also means cycles cannot hang the parser and the 44 genuinely orphaned
   * events in our reference capture are not dropped, which a strict walker would do.
   * What it CANNOT do is choose between sibling branches after a rewind or resume: both
   * are emitted, interleaved by timestamp, and read as one conversation. These counts
   * make that visible so a reader can tell when a transcript is affected.
   */
  treeShape: {
    roots: number;          // events whose parentUuid is null
    orphans: number;        // conversation events whose parent is not a conversation event
    forkPoints: number;     // parents with more than one conversation-event child
    duplicateTimestamps: number;
  };
  artifactsByType: Record<string, number>;
  compactionSummariesFound: number;
  /**
   * Events the parser skipped that look like they carried something — they had a `message`,
   * or they hung off a user/assistant event. Distinct from `unrecognizedEventTypes`, which
   * counts everything non-conversational including pure session bookkeeping.
   *
   * This exists because of `attachment`. A 2026-09-02 survey of 20 live transcripts
   * (Claude Code 2.1.229–2.1.241) found 622 `attachment` events in 3,096 — the second most
   * common type in the sample — with zero present in the March capture, and no `image`
   * content blocks anywhere (March had 4). Attachments appear to have moved out of message
   * content into their own event type, and `isConversationEvent` drops every one.
   *
   * Until the payload is handled, an import must at least SAY what it walked past. A
   * silently thinner import is the failure this pipeline was audited for.
   */
  skippedContentBearing: { total: number; byType: Record<string, number> };
}

export interface ParsedSession {
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  slug?: string;
  version?: string;
  versions?: string[];       // every Claude Code version seen — real files span more than one
  model?: string;            // most commonly used model
  turns: ParsedTurn[];
  compactionSummary?: string; // from acompact-* subagent events
  eventCount: number;
  skippedLines?: number;     // malformed JSONL lines that were skipped
  firstTimestamp?: string;
  lastTimestamp?: string;
  integrity?: ImportIntegrity;
}

// ── Event classification ──────────────────────────────────────

/**
 * Keep only user/assistant events that are part of the main conversation.
 * Skip: progress, file-history-snapshot, queue-operation, system events.
 */
export function isConversationEvent(event: RawEvent): boolean {
  if (event.type !== 'user' && event.type !== 'assistant') return false;
  if (!event.message) return false;
  // Skip sidechain events (subagent conversations)
  if (event.isSidechain) return false;
  return true;
}

/**
 * Classify a subagent by its agentId pattern.
 * - "acompact-*" -> compaction (context summarization)
 * - "aprompt_suggestion-*" -> prompt suggestion (skip entirely)
 * - "a{hex}" -> task subagent (store metadata)
 */
export function classifySubagent(agentId: string): 'task' | 'compact' | 'prompt_suggestion' {
  if (agentId.startsWith('acompact-')) return 'compact';
  if (agentId.startsWith('aprompt_suggestion-')) return 'prompt_suggestion';
  return 'task';
}

// ── Content extraction ────────────────────────────────────────

/**
 * Extract plain text from message content.
 * Handles both string content (simple user messages) and array content
 * (messages with mixed text/tool_use/tool_result/thinking blocks).
 */
export function extractTextContent(content: string | RawContentBlock[]): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === 'text' && block.text) {
      textParts.push(block.text);
    }
  }
  return textParts.join('\n\n');
}

/**
 * Create a short input summary for a tool_use block.
 * Returns just the key detail (e.g., "src/App.tsx" for Read, "npm test" for Bash).
 */
export function summarizeToolInput(block: RawContentBlock): string {
  const input = block.input || {};

  if (block.name === 'Read' && input.file_path) return shortenPath(input.file_path);
  if (block.name === 'Write' && input.file_path) return shortenPath(input.file_path);
  if (block.name === 'Edit' && input.file_path) return shortenPath(input.file_path);
  if (block.name === 'Bash' && input.command) {
    const cmd = String(input.command).slice(0, 60);
    return cmd + (String(input.command).length > 60 ? '...' : '');
  }
  if (block.name === 'Glob' && input.pattern) return String(input.pattern);
  if (block.name === 'Grep' && input.pattern) return String(input.pattern);
  if (block.name === 'Agent' && input.prompt) {
    const prompt = String(input.prompt).slice(0, 50);
    return prompt + (String(input.prompt).length > 50 ? '...' : '');
  }
  if (block.name === 'WebSearch' && input.query) return String(input.query);
  if (block.name === 'WebFetch' && input.url) return String(input.url);
  if (block.name === 'NotebookEdit' && input.notebook_path) return shortenPath(input.notebook_path);

  // Generic: stringify first input key's value
  const keys = Object.keys(input);
  if (keys.length > 0) {
    const val = String(input[keys[0]]).slice(0, 40);
    return val;
  }
  return '';
}

/** Shorten a file path to just the last 2 components */
function shortenPath(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length <= 2) return filePath;
  return parts.slice(-2).join('/');
}

// ── Artifact extraction ───────────────────────────────────────

/**
 * Extract tool_use artifacts from a message's content array.
 */
export function extractToolArtifacts(content: string | RawContentBlock[]): ParsedArtifact[] {
  if (typeof content === 'string') return [];
  if (!Array.isArray(content)) return [];

  const artifacts: ParsedArtifact[] = [];

  for (const block of content) {
    if (block.type === 'tool_use' && block.name) {
      artifacts.push({
        type: 'tool_use',
        toolName: block.name,
        inputSummary: summarizeToolInput(block),
        content: JSON.stringify({ name: block.name, input: block.input, id: block.id }),
      });
      continue;
    }

    // The three types below are declared on ParsedArtifact and were never emitted, so
    // "Read foo.ts" was stored and the file contents it returned were not. On our
    // reference capture that discarded 213 tool_results, 47 thinking blocks and 4 images
    // — 1,597 KB against 415 KB kept — with nothing recording that it happened.
    // Images keep a descriptor rather than the base64 payload: storing screenshots inline
    // is what made the discard defensible in the first place.
    if (block.type === 'tool_result') {
      const text = typeof block.content === 'string' ? block.content : '';
      artifacts.push({
        type: 'tool_result',
        toolName: block.is_error ? 'error' : 'result',
        inputSummary: truncate(text.replace(/\s+/g, ' ').trim(), 80),
        content: JSON.stringify({ tool_use_id: block.tool_use_id, content: text, is_error: !!block.is_error }),
      });
      continue;
    }

    if (block.type === 'thinking' && typeof block.thinking === 'string') {
      artifacts.push({
        type: 'thinking',
        toolName: 'thinking',
        inputSummary: truncate(block.thinking.replace(/\s+/g, ' ').trim(), 80),
        content: block.thinking,
      });
      continue;
    }

    if (block.type === 'image' && block.source) {
      const bytes = typeof block.source.data === 'string' ? block.source.data.length : 0;
      artifacts.push({
        type: 'image',
        toolName: 'image',
        inputSummary: `${block.source.media_type || 'image'} (~${Math.round(bytes * 0.75 / 1024)} KB, not stored)`,
        content: JSON.stringify({ media_type: block.source.media_type, type: block.source.type, approxBytes: Math.round(bytes * 0.75) }),
      });
    }
  }

  return artifacts;
}

/** Trim a string for a one-line summary field. */
function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + '\u2026';
}

// ── Compaction summary extraction ─────────────────────────────

/**
 * Extract the <summary> text from compaction subagent events.
 * Looks for assistant messages from acompact-* agents with <summary> tags.
 */
function extractCompactionSummaries(events: RawEvent[]): string[] {
  const summaries: string[] = [];
  for (const event of events) {
    // Only look at sidechain assistant events from compaction agents
    if (!event.isSidechain) continue;
    if (!event.agentId || !event.agentId.startsWith('acompact-')) continue;
    if (event.type !== 'assistant' || !event.message?.content) continue;

    const text = extractTextContent(event.message.content);
    const match = text.match(/<summary>([\s\S]*?)<\/summary>/);
    if (match) summaries.push(match[1].trim());
  }
  return summaries;
}

/**
 * The compaction summary for a session, taking the LAST one.
 *
 * This used to return the first match in file order. A session compacted three times
 * therefore carried its *stalest* summary, while findCompactionSummary() — reading the
 * same thing from subagent files thirty lines away — deliberately iterated latest-first.
 * Two paths, opposite attribution rules, and the caller preferred the stale one.
 */
function extractCompactionFromEvents(events: RawEvent[]): string | undefined {
  const summaries = extractCompactionSummaries(events);
  return summaries.length > 0 ? summaries[summaries.length - 1] : undefined;
}

// ── Turn boundary detection ───────────────────────────────────

/**
 * Detect whether a user event is a real human-typed message (turn boundary)
 * vs. a system-injected event (tool_result, compaction summary, hook feedback, etc.).
 *
 * Uses the JSONL metadata fields to distinguish real human messages from injections.
 * See docs/JSONL-SCHEMA.md for the full taxonomy of user event subtypes.
 *
 * Real human messages: have text content, no injection flags.
 * Compaction summaries: isCompactSummary=true (render as system banner, not "You")
 * Hook/skill/image injections: isMeta=true
 * Tool results: content is array of tool_result blocks (no text blocks)
 */
/** First text block (or string content) of a user event, untrimmed. */
function firstTextOf(event: RawEvent): string | undefined {
  const content = event.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const block = content.find((b) => b.type === 'text' && typeof b.text === 'string');
    return block?.text;
  }
  return undefined;
}

/**
 * Machine-authored user text, identified by shape rather than by a flag.
 * These all appear in real transcripts as role='user' with real text content;
 * some carry permissionMode and some carry no metadata at all.
 */
const MACHINE_TEXT_PREFIXES = [
  '<task-notification>',      // background agent completion (has permissionMode — anomalous)
  '<command-name>',           // /slash command echo
  '<local-command-stdout>',   // output of a /slash command
  '<command-message>',
  '<system-reminder>',
  'Unknown skill:',           // skill resolution failure
  'Stop hook feedback:',      // hook feedback that arrived without isMeta
];

export function isMachineAuthoredText(text: string): boolean {
  const t = text.trimStart();
  return MACHINE_TEXT_PREFIXES.some((prefix) => t.startsWith(prefix));
}

export function isHumanTurnBoundary(
  event: RawEvent,
  opts?: { requirePermissionMode?: boolean },
): boolean {
  if (event.type !== 'user') return false;
  if (event.message?.role !== 'user') return false;

  // Filter out system-injected user messages using metadata flags.
  // These events have role='user' in the JSONL but are NOT human-authored.
  // Without this filter, they'd become 'user' messages in the DB and render as "You" —
  // the "compaction misattribution" bug. See Step 8¾ verification.
  if (event.isCompactSummary) return false;  // Compaction context injection
  if (event.isMeta) return false;             // Hook feedback, skill injection, image reference
  if (event.isVisibleInTranscriptOnly) return false; // transcript-only echoes

  // POSITIVE test. docs/JSONL-SCHEMA.md: a real human message *has* permissionMode.
  // Testing only for the ABSENCE of isMeta/isCompactSummary was the original design and
  // it fails open: every format change is additive, so each new kind of injected user
  // event — /slash command echoes, local-command stdout, skill errors — arrives with no
  // flag at all, passes the negative test, and becomes a fabricated "You" turn that also
  // splits the real turn it landed inside. Measured on
  // exports/sessions/theseus-2026-03-22.jsonl: 6-7 of 75 turns fabricated, one of them
  // stealing 269 characters of assistant text from the human turn before it.
  //
  // Older transcripts predate permissionMode entirely, so the caller tells us whether
  // this session uses it (see parseEvents); when it doesn't, we fall back to the legacy
  // negative test rather than emitting zero turns.
  if (opts?.requirePermissionMode && event.permissionMode === undefined) return false;

  // Structural injections that DO carry permissionMode (documented as anomalous in
  // docs/JSONL-SCHEMA.md) or that predate it — excluded by shape, in both modes.
  const firstText = firstTextOf(event);
  if (firstText !== undefined && isMachineAuthoredText(firstText)) return false;

  const content = event.message.content;
  if (!content) return false;

  // String content = human-typed message
  if (typeof content === 'string') return content.trim().length > 0;

  // Array content: check for at least one text block with content
  // (tool_result arrays have no text blocks)
  if (Array.isArray(content)) {
    return content.some(
      (block) => block.type === 'text' && block.text && block.text.trim().length > 0
    );
  }

  return false;
}

// ── Turn grouping ─────────────────────────────────────────────

/**
 * Group conversation events into user/assistant turn pairs.
 *
 * Turn boundaries are detected by finding user events with actual text
 * content (human-typed messages), not by parentUuid=null. In real Claude
 * Code sessions, only the very first event has parentUuid=null — subsequent
 * human messages chain from the previous assistant's response.
 *
 * Within a turn, we collect:
 * - User text content -> userText
 * - All assistant text content -> assistantText
 * - All tool_use blocks -> artifacts
 */
export function groupIntoTurns(
  events: RawEvent[],
  opts?: { requirePermissionMode?: boolean },
): ParsedTurn[] {
  // Sort by timestamp to ensure chronological order.
  // Guard the operands: a single event with a missing or malformed timestamp used to
  // throw a TypeError here and abort the whole import with a 500. Claude Code 2.1.69
  // shipped a fix for its own crash on exactly that shape, so it exists in the wild.
  const sorted = [...events].sort((a, b) =>
    (a.timestamp || '').localeCompare(b.timestamp || '')
  );

  // Find turn boundary indices (human-typed user messages)
  const boundaryIndices: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (isHumanTurnBoundary(sorted[i], opts)) {
      boundaryIndices.push(i);
    }
  }

  const turns: ParsedTurn[] = [];

  for (let b = 0; b < boundaryIndices.length; b++) {
    const startIdx = boundaryIndices[b];
    const endIdx = b + 1 < boundaryIndices.length
      ? boundaryIndices[b + 1]
      : sorted.length;

    const turnRoot = sorted[startIdx];
    const turnEvents = sorted.slice(startIdx, endIdx);

    // User text from the boundary event
    const userText = extractTextContent(turnRoot.message!.content);

    // Collect assistant text and artifacts from events in this turn
    const assistantTextParts: string[] = [];
    const artifacts: ParsedArtifact[] = [];
    let model: string | undefined;
    let assistantTimestamp: string | undefined;
    let assistantOriginalId: string | undefined;

    for (const event of turnEvents) {
      if (!event.message?.content) continue;

      // Tool RESULTS come back as user-role events, not assistant ones — which is why
      // extracting artifacts only from assistant messages lost all of them. Verified on
      // exports/sessions/theseus-2026-03-22.jsonl: 213 tool_result blocks, every one of
      // them on a user event. Collect artifacts from those too, but never their text:
      // a tool result is not something the human said.
      if (event.message.role === 'user') {
        if (event.uuid !== turnRoot.uuid) {
          artifacts.push(...extractToolArtifacts(event.message.content));
        }
        continue;
      }

      if (event.message.role !== 'assistant') continue;

      // Last assistant event in the turn owns the reply's clock time and identity.
      if (event.timestamp) assistantTimestamp = event.timestamp;
      if (event.uuid) assistantOriginalId = event.uuid;

      const text = extractTextContent(event.message.content);
      if (text.trim()) assistantTextParts.push(text);

      // Extract tool artifacts from assistant messages
      artifacts.push(...extractToolArtifacts(event.message.content));

      // Track model
      if (event.message.model && !model) {
        model = event.message.model;
      }
    }

    const assistantText = assistantTextParts.join('\n\n');

    turns.push({
      userText: userText || '',
      assistantText: assistantText || '',
      timestamp: turnRoot.timestamp,
      originalId: turnRoot.uuid,
      assistantTimestamp,
      assistantOriginalId,
      model,
      artifacts: artifacts.length > 0 ? artifacts : undefined,
    });
  }

  return turns;
}

// ── Main parse function (pure, for testability) ───────────────

/**
 * Parse an array of raw JSONL events into a structured session.
 * This is the main pure function — no I/O, fully testable.
 */
export function parseEvents(events: unknown[]): ParsedSession {
  // Cast to RawEvent[] (events may come from JSON.parse which returns unknown)
  const rawEvents = events as RawEvent[];

  if (rawEvents.length === 0) {
    return {
      sessionId: undefined,
      turns: [],
      eventCount: 0,
    };
  }

  // Extract compaction summary from sidechain events (before filtering)
  const compactionSummary = extractCompactionFromEvents(rawEvents);

  // Filter to conversation events only (skip progress, file-history-snapshot, sidechains, etc.)
  const conversationEvents = rawEvents.filter(isConversationEvent);

  // Extract metadata: scan for the first event with each field
  // (queue-operation events lack cwd/gitBranch/slug/version)
  const first = rawEvents[0];
  // Scan for sessionId rather than trusting event 0. Real transcripts do not begin with a
  // conversation event — line 1 of exports/sessions/theseus-2026-03-22.jsonl is a
  // file-history-snapshot with no sessionId, while 897 of its 1,001 lines carry one.
  // When this came back undefined the 409 duplicate check was silently skipped and
  // originalSessionId never reached source_metadata.
  const sessionId = rawEvents.find(e => e.sessionId)?.sessionId ?? first.sessionId;
  const metaEvent = rawEvents.find(e => e.cwd) || first;
  const cwd = metaEvent.cwd;
  const gitBranch = metaEvent.gitBranch;
  const slug = metaEvent.slug;
  const version = metaEvent.version;
  // Real sessions span Claude Code versions (the committed capture spans 2.1.73 and
  // 2.1.81), so record the set, not just the first one seen.
  const versions = [...new Set(rawEvents.map(e => e.version).filter(Boolean) as string[])].sort();

  // Find timestamps
  const timestamps = rawEvents
    .map(e => e.timestamp)
    .filter(Boolean)
    .sort();
  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];

  // Group conversation events into turns.
  // A session "uses" permissionMode if any user event carries it; only then do we apply
  // the positive boundary test. Transcripts older than the field fall back to the legacy
  // negative test, so back-compat is decided per file rather than by a global flag.
  const requirePermissionMode = rawEvents.some(
    e => e.type === 'user' && e.permissionMode !== undefined,
  );
  const turns = groupIntoTurns(conversationEvents, { requirePermissionMode });

  // Integrity receipt — see ImportIntegrity. Everything the parser drops silently gets a
  // number here so that a format change reads as a suspicious count, not a thin import.
  const userEvents = conversationEvents.filter(e => e.type === 'user');
  const injectedUserEventsFiltered = userEvents.filter(
    e => !isHumanTurnBoundary(e, { requirePermissionMode }),
  ).length;

  const unrecognizedEventTypes: Record<string, number> = {};
  for (const e of rawEvents) {
    if (e.type === 'user' || e.type === 'assistant') continue;
    unrecognizedEventTypes[e.type] = (unrecognizedEventTypes[e.type] || 0) + 1;
  }

  // Tree shape, measured but not acted on — see ImportIntegrity.treeShape.
  const convByUuid = new Set(conversationEvents.map(e => e.uuid));
  const childCounts = new Map<string, number>();
  let roots = 0;
  let orphans = 0;
  for (const e of conversationEvents) {
    if (e.parentUuid == null) { roots++; continue; }
    if (!convByUuid.has(e.parentUuid)) orphans++;
    childCounts.set(e.parentUuid, (childCounts.get(e.parentUuid) || 0) + 1);
  }
  const forkPoints = [...childCounts.values()].filter(n => n > 1).length;
  const tsCounts = new Map<string, number>();
  for (const e of conversationEvents) {
    if (!e.timestamp) continue;
    tsCounts.set(e.timestamp, (tsCounts.get(e.timestamp) || 0) + 1);
  }
  const duplicateTimestamps = [...tsCounts.values()].filter(n => n > 1).length;

  // Events that are not conversation events but look like they carried something.
  //
  // Deliberately excludes the types the parser has always known about and skips on
  // purpose: `system` telemetry (turn_duration, stop_hook_summary, compact_boundary),
  // `progress`, `file-history-snapshot`, `queue-operation`. Those hang off conversation
  // events routinely and carry no importable content, so counting them would make this
  // number fire on every transcript and mean nothing — the alarm-fatigue failure that
  // the refresh script's `isSidechain` false positive already demonstrated once.
  //
  // What survives the filter is a type nobody has classified yet that nonetheless looks
  // attached to the conversation. That is exactly `attachment`.
  const KNOWN_SKIPPED_TYPES = new Set([
    'system', 'progress', 'file-history-snapshot', 'queue-operation', 'last-prompt',
  ]);
  const skippedByType: Record<string, number> = {};
  for (const e of rawEvents) {
    if (isConversationEvent(e)) continue;
    if (KNOWN_SKIPPED_TYPES.has(e.type)) continue;
    const looksContentBearing = !!e.message || (!!e.parentUuid && convByUuid.has(e.parentUuid));
    if (looksContentBearing) skippedByType[e.type] = (skippedByType[e.type] || 0) + 1;
  }
  const skippedContentBearingTotal = Object.values(skippedByType).reduce((a, b) => a + b, 0);

  const artifactsByType: Record<string, number> = {};
  for (const turn of turns) {
    for (const a of turn.artifacts || []) {
      artifactsByType[a.type] = (artifactsByType[a.type] || 0) + 1;
    }
  }

  // Determine most common model
  const modelCounts = new Map<string, number>();
  for (const event of conversationEvents) {
    if (event.message?.model) {
      const m = event.message.model;
      modelCounts.set(m, (modelCounts.get(m) || 0) + 1);
    }
  }
  let model: string | undefined;
  let maxCount = 0;
  for (const [m, count] of modelCounts) {
    if (count > maxCount) {
      model = m;
      maxCount = count;
    }
  }

  return {
    sessionId,
    cwd,
    gitBranch,
    slug,
    version,
    model,
    turns,
    compactionSummary,
    eventCount: rawEvents.length,
    firstTimestamp,
    lastTimestamp,
    versions,
    integrity: {
      eventCount: rawEvents.length,
      conversationEvents: conversationEvents.length,
      turnsEmitted: turns.length,
      skippedLines: 0, // filled in by the file-reading layer, which owns the count
      injectedUserEventsFiltered,
      unrecognizedEventTypes,
      versionsSeen: versions,
      boundaryMode: requirePermissionMode ? 'permissionMode' : 'legacy-flags',
      treeShape: { roots, orphans, forkPoints, duplicateTimestamps },
      artifactsByType,
      compactionSummariesFound: extractCompactionSummaries(rawEvents).length,
      skippedContentBearing: { total: skippedContentBearingTotal, byType: skippedByType },
    },
  };
}

// ── File I/O (async, for the API layer) ───────────────────────

export interface ReadJsonlResult {
  events: RawEvent[];
  skippedLines: number;
}

/**
 * Read a JSONL file line-by-line and parse each line as JSON.
 * Skips malformed lines and reports how many were skipped.
 */
export async function readJsonlFile(filePath: string): Promise<ReadJsonlResult> {
  const events: RawEvent[] = [];
  let skippedLines = 0;

  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      skippedLines++;
    }
  }

  return { events, skippedLines };
}

/**
 * Scan for compaction subagent files and extract the latest summary.
 * Compaction subagents live at: <sessionDir>/subagents/agent-acompact-*.jsonl
 */
async function findCompactionSummary(sessionPath: string): Promise<string | undefined> {
  const sessionDir = path.dirname(sessionPath);
  const sessionId = path.basename(sessionPath, '.jsonl');
  const subagentDir = path.join(sessionDir, sessionId, 'subagents');

  if (!fs.existsSync(subagentDir)) return undefined;

  const files = fs.readdirSync(subagentDir)
    .filter(f => f.startsWith('agent-acompact-') && f.endsWith('.jsonl'))
    .sort();

  // Try from latest to earliest
  for (let i = files.length - 1; i >= 0; i--) {
    const compactPath = path.join(subagentDir, files[i]);
    try {
      const { events } = await readJsonlFile(compactPath);
      const summary = extractCompactionFromEvents(events);
      if (summary) return summary;
    } catch {
      // Skip unreadable files
    }
  }

  return undefined;
}

/**
 * Parse JSONL content from a string (for uploaded files or in-memory content).
 * Splits by newline, parses each line as JSON, skips malformed lines.
 */
export function parseJsonlContent(content: string): ReadJsonlResult {
  const events: RawEvent[] = [];
  let skippedLines = 0;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      skippedLines++;
    }
  }

  return { events, skippedLines };
}

/**
 * Parse a Claude Code session from in-memory JSONL content.
 * Used for uploaded files (cloud agent sessions) where there's no local disk path.
 * Skips subagent compaction file scanning (not available for uploads —
 * inline compaction events in the JSONL are still extracted).
 */
export function parseClaudeCodeSessionFromContent(content: string): ParsedSession {
  const { events, skippedLines } = parseJsonlContent(content);
  const session = parseEvents(events);
  if (session.integrity) session.integrity.skippedLines = skippedLines;
  if (skippedLines > 0) {
    session.skippedLines = skippedLines;
  }
  return session;
}

/**
 * Main entry point: parse a Claude Code session from disk.
 *
 * @param sessionPath - Full path to the session .jsonl file
 * @returns ParsedSession with turns, artifacts, and metadata
 */
export async function parseClaudeCodeSession(sessionPath: string): Promise<ParsedSession> {
  const { events, skippedLines } = await readJsonlFile(sessionPath);
  const session = parseEvents(events);
  if (session.integrity) session.integrity.skippedLines = skippedLines;
  if (skippedLines > 0) {
    session.skippedLines = skippedLines;
  }

  // Also try to find compaction summary from separate subagent files
  if (!session.compactionSummary) {
    const compactionSummary = await findCompactionSummary(sessionPath);
    if (compactionSummary) {
      session.compactionSummary = compactionSummary;
    }
  }

  return session;
}
