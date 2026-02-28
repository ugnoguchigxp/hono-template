export interface ChatSession {
  id: string;
  title: string;
  channel: string;
  externalSessionId?: string | null;
  participants?: string[] | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: string;
  sender?: string | null;
  channelMessageId?: string | null;
  content: string;
  createdAt: string;
}

export interface ChatSearchResult {
  messageId: string;
  sessionId: string;
  content: string;
  role: string;
  sender?: string | null;
  channel: string;
  title: string;
  createdAt: string;
}
