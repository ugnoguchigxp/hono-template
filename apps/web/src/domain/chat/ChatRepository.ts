import type {
  ChatMessage,
  ChatMessagePage,
  ChatSearchResult,
  ChatSession,
  ChatSort,
} from './types.js';

const API_BASE_URL = '/api/v1/chat';

export class ChatRepository {
  async listSessions(query?: string, sort?: ChatSort): Promise<ChatSession[]> {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (sort?.sortBy) params.set('sortBy', sort.sortBy);
    if (sort?.sortDir) params.set('sortDir', sort.sortDir);

    const response = await fetch(`${API_BASE_URL}/sessions?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    const json = await response.json();
    return json.data;
  }

  async createSession(input: { title: string; channel: string }): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create session');
    const json = await response.json();
    return json.data;
  }

  async updateSession(
    sessionId: string,
    input: Partial<Pick<ChatSession, 'title' | 'channel' | 'externalSessionId'>>
  ): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to update session');
    const json = await response.json();
    return json.data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete session');
  }

  async listMessages(
    sessionId: string,
    query?: string,
    paging?: { limit?: number; offset?: number }
  ): Promise<ChatMessagePage> {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (paging?.limit !== undefined) params.set('limit', String(paging.limit));
    if (paging?.offset !== undefined) params.set('offset', String(paging.offset));

    const response = await fetch(
      `${API_BASE_URL}/sessions/${sessionId}/messages?${params.toString()}`
    );
    if (!response.ok) throw new Error('Failed to fetch messages');
    const json = await response.json();
    return json;
  }

  async createMessage(
    sessionId: string,
    input: { role: string; content: string; sender?: string }
  ): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create message');
    const json = await response.json();
    return json.data;
  }

  async searchMessages(
    q: string,
    sort?: ChatSort,
    paging?: { limit?: number; offset?: number }
  ): Promise<ChatSearchResult[]> {
    const params = new URLSearchParams({ q });
    if (sort?.sortBy) params.set('sortBy', sort.sortBy);
    if (sort?.sortDir) params.set('sortDir', sort.sortDir);
    if (paging?.limit !== undefined) params.set('limit', String(paging.limit));
    if (paging?.offset !== undefined) params.set('offset', String(paging.offset));
    const response = await fetch(`${API_BASE_URL}/messages/search?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to search messages');
    const json = await response.json();
    return json.data;
  }
}
