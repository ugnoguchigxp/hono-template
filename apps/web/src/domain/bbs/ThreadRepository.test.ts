import { describe, it, expect, vi, afterEach } from 'vitest';
import { ThreadRepository } from './ThreadRepository.js';

const createMockResponse = (ok: boolean, data: unknown) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
});

describe('ThreadRepository', () => {
  const repo = new ThreadRepository();

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lists threads with paging', async () => {
    const payload = { threads: [{ id: 't1' }], total: 1 };
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(true, payload));
    vi.stubGlobal('fetch', fetchMock);

    const result = await repo.list(2, 5);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/bbs/threads?page=2&limit=5');
    expect(result).toEqual(payload);
  });

  it('throws on list failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(repo.list()).rejects.toThrow('Failed to fetch threads');
  });

  it('gets thread by id', async () => {
    const payload = { id: 't1', comments: [] };
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(true, payload));
    vi.stubGlobal('fetch', fetchMock);

    const result = await repo.getById('t1');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/bbs/threads/t1');
    expect(result).toEqual(payload);
  });

  it('throws on getById failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(repo.getById('t1')).rejects.toThrow('Failed to fetch thread detail');
  });

  it('creates a thread', async () => {
    const payload = { id: 't1', title: 'hello' };
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(true, payload));
    vi.stubGlobal('fetch', fetchMock);

    const result = await repo.create({ title: 'hello', content: 'world' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/bbs/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'hello', content: 'world' }),
    });
    expect(result).toEqual(payload);
  });

  it('throws on create failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(repo.create({ title: 'hello', content: 'world' })).rejects.toThrow(
      'Failed to create thread'
    );
  });
});
