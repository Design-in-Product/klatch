export interface Channel {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'complete' | 'streaming' | 'error';
  createdAt: string;
}

export interface StreamEvent {
  type: 'text_delta' | 'message_complete' | 'error';
  messageId: string;
  content: string;
}
