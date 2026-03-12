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
  model?: string;           // model used for assistant response
  artifacts?: ParsedArtifact[];
}

export interface ParsedSession {
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  slug?: string;
  version?: string;
  model?: string;            // most commonly used model
  turns: ParsedTurn[];
  compactionSummary?: string; // from acompact-* subagent events
  eventCount: number;
  skippedLines?: number;     // malformed JSONL lines that were skipped
  firstTimestamp?: string;
  lastTimestamp?: string;
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
    }
  }

  return artifacts;
}

// ── Compaction summary extraction ─────────────────────────────

/**
 * Extract the <summary> text from compaction subagent events.
 * Looks for assistant messages from acompact-* agents with <summary> tags.
 */
function extractCompactionFromEvents(events: RawEvent[]): string | undefined {
  for (const event of events) {
    // Only look at sidechain assistant events from compaction agents
    if (!event.isSidechain) continue;
    if (!event.agentId || !event.agentId.startsWith('acompact-')) continue;
    if (event.type !== 'assistant' || !event.message?.content) continue;

    const text = extractTextContent(event.message.content);
    const match = text.match(/<summary>([\s\S]*?)<\/summary>/);
    if (match) return match[1].trim();
  }
  return undefined;
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
export function isHumanTurnBoundary(event: RawEvent): boolean {
  if (event.type !== 'user') return false;
  if (event.message?.role !== 'user') return false;

  // Filter out system-injected user messages using metadata flags.
  // These events have role='user' in the JSONL but are NOT human-authored.
  // Without this filter, they'd become 'user' messages in the DB and render as "You" —
  // the "compaction misattribution" bug. See Step 8¾ verification.
  if (event.isCompactSummary) return false;  // Compaction context injection
  if (event.isMeta) return false;             // Hook feedback, skill injection, image reference

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
export function groupIntoTurns(events: RawEvent[]): ParsedTurn[] {
  // Sort by timestamp to ensure chronological order
  const sorted = [...events].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  // Find turn boundary indices (human-typed user messages)
  const boundaryIndices: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (isHumanTurnBoundary(sorted[i])) {
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

    for (const event of turnEvents) {
      if (event.message?.role !== 'assistant') continue;
      if (!event.message.content) continue;

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
  const sessionId = first.sessionId;
  const metaEvent = rawEvents.find(e => e.cwd) || first;
  const cwd = metaEvent.cwd;
  const gitBranch = metaEvent.gitBranch;
  const slug = metaEvent.slug;
  const version = metaEvent.version;

  // Find timestamps
  const timestamps = rawEvents
    .map(e => e.timestamp)
    .filter(Boolean)
    .sort();
  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];

  // Group conversation events into turns
  const turns = groupIntoTurns(conversationEvents);

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
 * Main entry point: parse a Claude Code session from disk.
 *
 * @param sessionPath - Full path to the session .jsonl file
 * @returns ParsedSession with turns, artifacts, and metadata
 */
export async function parseClaudeCodeSession(sessionPath: string): Promise<ParsedSession> {
  const { events, skippedLines } = await readJsonlFile(sessionPath);
  const session = parseEvents(events);
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
