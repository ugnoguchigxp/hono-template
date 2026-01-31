import { describe, it, expect, vi, afterEach } from 'vitest';
import { CommentRepository } from './CommentRepository.js';

const createMockResponse = (ok: boolean, data: unknown) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
});

describe('CommentRepository', () => {
  const repo = new CommentRepository();

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates a comment for a thread', async () => {
    const payload = { id: 'c1', content: 'Nice!' };
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(true, payload));
    vi.stubGlobal('fetch', fetchMock);

    const result = await repo.create('t1', { content: 'Nice!' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/bbs/threads/t1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Nice!' }),
    });
    expect(result).toEqual(payload);
  });

  it('throws on create failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(repo.create('t1', { content: 'Nice!' })).rejects.toThrow(
      'Failed to post comment'
    );
  });
});
