export const AVAILABLE_MODELS = {
  'claude-opus-4-20250514': { label: 'Opus', description: 'Most capable, highest quality' },
  'claude-sonnet-4-20250514': { label: 'Sonnet', description: 'Balanced speed and quality' },
  'claude-haiku-3-20250307': { label: 'Haiku', description: 'Fastest, most compact' },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

export const DEFAULT_MODEL: ModelId = 'claude-opus-4-20250514';

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
  createdAt: string;
}

export interface StreamEvent {
  type: 'text_delta' | 'message_complete' | 'error';
  messageId: string;
  content: string;
}
