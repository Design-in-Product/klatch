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

export interface Entity {
  id: string;
  name: string;
  model: ModelId;
  systemPrompt: string;
  color: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  systemPrompt: string;
  model: ModelId;
  createdAt: string;
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
}

export interface StreamEvent {
  type: 'text_delta' | 'message_complete' | 'error';
  messageId: string;
  content: string;
}
