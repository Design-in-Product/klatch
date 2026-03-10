export const AVAILABLE_MODELS = {
  'claude-opus-4-6': { label: 'Opus', description: 'Most capable, highest quality' },
  'claude-sonnet-4-6': { label: 'Sonnet', description: 'Balanced speed and quality' },
  'claude-haiku-3-5-20241022': { label: 'Haiku', description: 'Fastest, most compact' },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

export const DEFAULT_MODEL: ModelId = 'claude-opus-4-6';

// Legacy model ID mapping for backward compatibility
export const MODEL_ALIASES: Record<string, ModelId> = {
  'claude-opus-4-20250514': 'claude-opus-4-6',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
  'claude-haiku-3-20250307': 'claude-haiku-3-5-20241022',
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
  panel: { label: 'Panel', description: 'All entities respond independently in parallel' },
  roundtable: { label: 'Roundtable', description: 'Entities respond sequentially, each seeing prior responses' },
  directed: { label: 'Directed', description: 'Use @mentions to route messages to specific entities' },
} as const;

export type InteractionMode = keyof typeof INTERACTION_MODES;
export const DEFAULT_INTERACTION_MODE: InteractionMode = 'panel';

export interface Entity {
  id: string;
  name: string;
  handle?: string;
  model: ModelId;
  systemPrompt: string;
  color: string;
  createdAt: string;
}

// Channel source types for imported conversations
export type ChannelSource = 'native' | 'claude-code' | 'claude-ai';

export interface Channel {
  id: string;
  name: string;
  systemPrompt: string;
  model: ModelId;
  mode: InteractionMode;
  createdAt: string;
  entityCount?: number; // populated by list endpoint for sidebar grouping
  source?: ChannelSource;
  sourceMetadata?: string; // JSON string
}

export interface Message {
  id: string;
  channelId: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'complete' | 'streaming' | 'error';
  model?: ModelId;
  entityId?: string;
  createdAt: string;
  originalTimestamp?: string; // preserved timestamp from imported conversations
  originalId?: string;       // original message/event ID from source
  artifactCount?: number;    // populated by query for display (tool uses, thinking, etc.)
}

// ── Artifacts (tool use, thinking, images from imported conversations) ──

export type ArtifactType = 'tool_use' | 'tool_result' | 'thinking' | 'image';

export interface MessageArtifact {
  id: string;
  messageId: string;
  type: ArtifactType;
  toolName?: string;     // tool name for tool_use/tool_result (e.g. "Read", "Bash")
  inputSummary?: string; // human-readable summary (e.g. "src/App.tsx", "npm test")
  content?: string;      // full JSON or text content
  createdAt: string;
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
