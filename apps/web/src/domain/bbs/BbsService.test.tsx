import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThreads, useThread, useCreateThread, usePostComment } from './BbsService.js';

const listMock = vi.fn();
const getByIdMock = vi.fn();
const createThreadMock = vi.fn();
const createCommentMock = vi.fn();

vi.mock('./ThreadRepository.js', () => ({
  ThreadRepository: vi.fn().mockImplementation(() => ({
    list: listMock,
    getById: getByIdMock,
    create: createThreadMock,
  })),
}));

vi.mock('./CommentRepository.js', () => ({
  CommentRepository: vi.fn().mockImplementation(() => ({
    create: createCommentMock,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('BbsService hooks', () => {
  it('useThreads fetches threads', async () => {
    listMock.mockResolvedValue({ threads: [{ id: 't1' }], total: 1 });
    const wrapper = createWrapper();

    const { result } = renderHook(() => useThreads(1, 10), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMock).toHaveBeenCalledWith(1, 10);
    expect(result.current.data?.threads[0].id).toBe('t1');
  });

  it('useThread is disabled when id is empty', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useThread(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(getByIdMock).not.toHaveBeenCalled();
  });

  it('useCreateThread calls repository and invalidates', async () => {
    createThreadMock.mockResolvedValue({ id: 't2' });
    const wrapper = createWrapper();

    const { result } = renderHook(() => useCreateThread(), { wrapper });

    await result.current.mutateAsync({ title: 't', content: 'c' });

    expect(createThreadMock).toHaveBeenCalledWith({ title: 't', content: 'c' });
  });

  it('usePostComment calls repository and invalidates', async () => {
    createCommentMock.mockResolvedValue({ id: 'c1' });
    const wrapper = createWrapper();

    const { result } = renderHook(() => usePostComment('t1'), { wrapper });

    await result.current.mutateAsync({ content: 'hey' });

    expect(createCommentMock).toHaveBeenCalledWith('t1', { content: 'hey' });
  });
});
