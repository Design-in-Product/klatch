export const AVAILABLE_MODELS = {
  'claude-opus-5': { label: 'Opus 5', description: 'Newest Opus — most capable, highest quality' },
  'claude-opus-4-8': { label: 'Opus 4.8', description: 'Long-horizon agentic work, warmer prose' },
  'claude-opus-4-7': { label: 'Opus 4.7', description: 'Adds xhigh effort + thinking summaries' },
  'claude-opus-4-6': { label: 'Opus 4.6', description: 'Prior-generation Opus' },
  'claude-sonnet-5': { label: 'Sonnet 5', description: 'Newest Sonnet — balanced speed and quality (new tokenizer: ~1.3× tokens vs 4.6)' },
  'claude-sonnet-4-6': { label: 'Sonnet', description: 'Balanced speed and quality' },
  'claude-fable-5': { label: 'Fable 5', description: 'Frontier capability, export-control-cleared' },
  'claude-haiku-4-5-20251001': { label: 'Haiku', description: 'Fastest, most compact' },
} as const;

// `ModelId` is a readable alias for a Claude model id, validated at RUNTIME
// against the discovered `/api/models` set (server `isValidModel`) — not a
// compile-time union. The static union was a per-release treadmill against a
// moving lineup (the bug behind "Klatch tops out at 4.7"). `AVAILABLE_MODELS`
// below is now a curated overlay (labels, aliases, offline fallback, default),
// not the validation gate. (xian-confirmed 2026-06-21.)
export type ModelId = string;

// Default model for new channels + new entities. Flipped 2026-05-12 (xian)
// from 4-6 → 4-7. Note: 4.7 uses a new tokenizer producing 1×–1.35× tokens
// for equivalent input, which will hit the compaction threshold (Round 17
// set this to 160K) meaningfully sooner. Worth a re-evaluation pass after
// a few real 4.7 channels run.
//
// On automation: this stays a manual constant by design. Anthropic doesn't
// surface a "recommended default" signal in the Models API; the choice has
// product implications (tokenizer, cost, behavior) that warrant a deliberate
// decision per release. Future env-var override is the natural next step
// when a hosted deployment needs to flip without redeploying.
export const DEFAULT_MODEL: ModelId = 'claude-opus-5';

/**
 * Effort level assigned to a new entity when the user doesn't pick one.
 *
 * **Uniform by design (xian, 2026-08-10).** This replaced a per-model rule
 * (`sonnet-4-6 → medium`, everything else → high) which was correct when
 * written and would have gone stale with every model release — the same class
 * of literal that left the effort-ladder UI gating models by hardcoded ID. One
 * rule survives releases; a per-model table needs maintaining forever, and
 * nobody notices when it rots.
 *
 * **Why `high` rather than `medium`.** The failure modes are asymmetric: too
 * high costs money and latency (visible, attributable), too low produces
 * subtly thinner reasoning (invisible, and a user may never realize it's a
 * setting rather than the model's ceiling).
 *
 * **Revisit — deferred, not rejected.** `medium` is the better default once
 * the effort control is visibly discoverable in the UI, at which point the
 * user can see the dial and the hidden-quality-loss risk goes away. There's a
 * real Klatch-specific argument for it: a klatch multiplies effort by roster
 * size (one message to six agents = six responses), and on Opus-5-class models
 * `medium` performs close to prior generations' `high`. Gated on Iris's
 * treatment of the control, not on further architectural work.
 */
export const DEFAULT_EFFORT: EffortLevel = 'high';

// Legacy model ID mapping for backward compatibility
export const MODEL_ALIASES: Record<string, ModelId> = {
  'claude-opus-4-20250514': 'claude-opus-4-6',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
  'claude-3-haiku-20240307': 'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-20241022': 'claude-haiku-4-5-20251001',
};

// Entity avatar colors — visually distinct, accessible on both light and dark backgrounds
export const ENTITY_COLORS = [
  '#6366f1', // indigo (default entity)
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
] as const;

export const DEFAULT_ENTITY_ID = 'default-entity';

// Interaction modes for multi-entity channels
export const INTERACTION_MODES = {
  panel: { label: 'Broadcast', description: 'All agents respond independently to your message' },
  roundtable: { label: 'Roundtable', description: 'Agents respond in sequence, each seeing prior responses' },
  directed: { label: 'Directed', description: 'Use @mentions to address specific agents' },
} as const;

export type InteractionMode = keyof typeof INTERACTION_MODES;
export const DEFAULT_INTERACTION_MODE: InteractionMode = 'panel';

// Effort levels supported across Claude models. 'xhigh' added 2026-05-11 for Opus 4.7,
// which introduced a new tier between 'high' and 'max'; Claude Code defaults to xhigh after 4.7.
export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface MicroReflection {
  observation: string;
  createdAt: string;
  channelId: string;
  type: 'session-end' | 'correction' | 'observation';
  /**
   * Where this reflection entered the system. Optional for back-compat with
   * pre-Phase-5c rows which were always written via the Klatch UI / internal
   * pipelines. Treat as a thin transport/wrapper layer identifier — values
   * may include 'klatch-ui', 'mcp', 'auto', 'import', and future ingresses.
   */
  ingress?: string;
  /**
   * Optional expiration timestamp (ISO 8601). When set and in the past, the
   * reflection is "invalidated" — it stays in the auditable record but is
   * filtered out of context-assembly reads (field notes, MCP entity
   * package). Mirrors the Zep/Graphiti and MemPalace temporal-validity
   * pattern: year-old reflections aren't "wrong" when superseded, just no
   * longer applicable. Added 2026-05-11 (Argus MemPalace-readiness memo).
   * Setters: UI "Invalidate this reflection" affordance (future), explicit
   * user edit, or future automatic supersession logic.
   */
  validUntil?: string;
}

/**
 * Is a reflection still active (i.e., should be included in context-assembly
 * reads)? A missing `validUntil` means "indefinitely active"; a future
 * timestamp means "still active"; a past timestamp means "invalidated".
 * Tolerant of malformed timestamps — treats them as active (no accidental
 * suppression on bad data).
 */
export function isReflectionActive(r: MicroReflection, now: Date = new Date()): boolean {
  if (!r.validUntil) return true;
  const t = Date.parse(r.validUntil);
  if (Number.isNaN(t)) return true;
  return t > now.getTime();
}

export interface Entity {
  id: string;
  name: string;
  handle?: string;
  model: ModelId;
  effort: EffortLevel;
  systemPrompt: string;
  color: string;
  reflections?: MicroReflection[];
  createdAt: string;
  /** Optional: number of channels this entity is assigned to. Populated by the entity-list endpoint via a JOIN; undefined elsewhere. */
  channelCount?: number;
}

// Channel source types for imported conversations
// 'klatch' = imported from a canonical Klatch context package (Klatch-to-Klatch handoff)
export type ChannelSource = 'native' | 'claude-code' | 'claude-ai' | 'klatch';

// Channel types: chat (1:1 with Claude) vs klatch (multi-entity group)
export type ChannelType = 'chat' | 'klatch';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;         // 'chat' (1:1) or 'klatch' (multi-entity group)
  systemPrompt: string;
  model: ModelId;
  mode: InteractionMode;
  createdAt: string;
  entityCount?: number; // populated by list endpoint for sidebar grouping
  source?: ChannelSource;
  sourceMetadata?: string; // JSON string
  compactionState?: string; // JSON: { summary, timestamp, beforeMessageId }
  projectId?: string;       // FK to projects table (nullable — chats can be unlinked)
  projectName?: string;     // populated by enriched list endpoint (JOIN to projects)
  messageCount?: number;        // populated by enriched list endpoint
  lastMessageAt?: string | null; // populated by enriched list endpoint
}

// Project: shared context across multiple channels
export interface Project {
  id: string;
  name: string;
  instructions: string;
  memory: string;          // accumulated project memory (from MEMORY.md, claude.ai memories, etc.)
  source: ChannelSource;
  sourceMetadata: string; // JSON string
  createdAt: string;
}

// ── Metadata types (Step 8½) ─────────────────────────────────

export interface ChannelStats {
  messageCount: number;
  artifactCount: number;
  toolBreakdown: { tool: string; count: number }[];
  lastMessageAt: string | null;
}

export interface ProjectGroup {
  projectId: string | null;     // FK to projects table, null = ungrouped
  projectName: string;          // from projects table, or "Imported" for unlinked
  channels: Channel[];
}

/**
 * Why a turn stopped without finishing cleanly. `end_turn` and `stop_sequence`
 * are clean finishes and carry no stopReason — they stay `status: 'complete'`.
 * `context_window_exceeded` is the SDK's `model_context_window_exceeded`,
 * shortened here; the other three pass through from the API as-is.
 * Shape per docs/ux/message-incomplete-status-2026-08-11.md (Iris, 8/11).
 */
export type MessageStopReason =
  | 'max_tokens'
  | 'context_window_exceeded'
  | 'refusal'
  | 'pause_turn';

export interface Message {
  id: string;
  channelId: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'complete' | 'streaming' | 'error' | 'incomplete';
  stopReason?: MessageStopReason; // set only when status is 'incomplete'
  model?: ModelId;
  entityId?: string;
  createdAt: string;
  originalTimestamp?: string; // preserved timestamp from imported conversations
  originalId?: string;       // original message/event ID from source
  artifactCount?: number;    // populated by query for display (tool uses, thinking, etc.)
  artifacts?: MessageArtifact[];  // populated when ?include=artifacts
}

// ── Artifacts (tool use, thinking, images from imported conversations) ──

export type ArtifactType = 'tool_use' | 'tool_result' | 'thinking' | 'image' | 'file';

export interface MessageArtifact {
  id: string;
  messageId: string;
  type: ArtifactType;
  toolName?: string;        // tool name for tool_use/tool_result (e.g. "Read", "Bash")
  inputSummary?: string;    // human-readable summary (e.g. "src/App.tsx", "npm test")
  content?: string;         // full JSON or text content
  // File attachment fields (Step 9)
  fileName?: string;        // original filename (e.g. "report.txt")
  fileMimeType?: string;    // MIME type (e.g. "text/plain", "image/png")
  fileSizeBytes?: number;   // file size in bytes
  fileStorageKey?: string;  // key for disk storage lookup
  createdAt: string;
}

// ── File Domain Model ────────────────────────────────────────

/** Scope levels for file references */
export type FileRefScope = 'project' | 'channel' | 'entity' | 'message';

/** How a file was added at this scope */
export type FileRefType = 'pinned' | 'created' | 'received' | 'imported';

/** Canonical file record — one row per unique file on disk */
export interface KlatchFile {
  id: string;
  name: string;           // display name (e.g., "spec.md")
  mimeType: string;
  sizeBytes: number;
  storageKey: string;     // disk lookup key in klatch-files/
  createdBy?: string;     // entity ID, 'user', or 'import'
  createdAt: string;
}

/** File reference — visibility at a given scope */
export interface FileRef {
  id: string;
  fileId: string;
  scope: FileRefScope;
  scopeId: string;        // project/channel/entity/message ID
  refType: FileRefType;
  addedAt: string;
  addedBy?: string;       // who promoted/assigned it ('user', entity ID)
}

/** File with its reference context (joined for API responses) */
export interface FileWithRef extends KlatchFile {
  refId: string;
  scope: FileRefScope;
  scopeId: string;
  refType: FileRefType;
  addedAt: string;
  addedBy?: string;
}

// ── Import types ──────────────────────────────────────────────

export interface ImportResult {
  channelId: string;
  channelName: string;
  messageCount: number;
  artifactCount: number;
  source: ChannelSource;
  duplicate: boolean;     // true if session was already imported (dedup warning)
}

export interface StreamEvent {
  type: 'text_delta' | 'message_complete' | 'error';
  messageId: string;
  content: string;
  /**
   * Present on `message_complete` when the turn ended without finishing cleanly.
   * The client updates its local message optimistically on stream completion
   * rather than refetching the row, so the reason has to ride the event or the
   * bubble renders as a clean completion until the channel is reloaded.
   */
  stopReason?: MessageStopReason;
}

// ── @-mention parsing for directed mode ──────────────────────

/**
 * Extract @-mentioned entity names from message content.
 * Matches `@EntityName` at word boundaries. Entity names may contain
 * letters, numbers, hyphens, underscores, and spaces (when quoted).
 *
 * Supported formats:
 *   @Claude       → "Claude"
 *   @code-reviewer → "code-reviewer"
 *   @"Chief of Staff" → "Chief of Staff"
 *
 * Returns an array of mentioned names (lowercased for matching).
 */
export function parseMentions(content: string): string[] {
  const mentions: string[] = [];

  // Match @"quoted name" or @word-with-hyphens_and_numbers
  const regex = /@"([^"]+)"|@([\w][\w-]*)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1] || match[2]; // quoted group or unquoted group
    if (name) mentions.push(name.toLowerCase());
  }

  return [...new Set(mentions)]; // deduplicate
}

/**
 * Resolve mentioned names to entities. Case-insensitive matching
 * against both entity name and optional handle (slug).
 * Returns the matched entities in the order they appear in the entities list.
 */
export function resolveMentions(content: string, entities: Entity[]): Entity[] {
  const mentionedNames = parseMentions(content);
  if (mentionedNames.length === 0) return [];

  return entities.filter((e) =>
    mentionedNames.includes(e.name.toLowerCase()) ||
    (e.handle && mentionedNames.includes(e.handle.toLowerCase()))
  );
}
