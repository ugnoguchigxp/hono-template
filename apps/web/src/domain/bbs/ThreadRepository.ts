import { Thread, ThreadDetail, CreateThreadInput, ListThreadsResponse } from './types.js';

const API_BASE_URL = '/api/v1/bbs';

export class ThreadRepository {
  async list(page = 1, limit = 10): Promise<ListThreadsResponse> {
    const response = await fetch(`${API_BASE_URL}/threads?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch threads');
    }
    return response.json();
  }

  async getById(id: string): Promise<ThreadDetail> {
    const response = await fetch(`${API_BASE_URL}/threads/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch thread detail');
    }
    return response.json();
  }

  async create(input: CreateThreadInput): Promise<Thread> {
    const response = await fetch(`${API_BASE_URL}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error('Failed to create thread');
    }
    return response.json();
  }
}
