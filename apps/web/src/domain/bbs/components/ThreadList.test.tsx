import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ThreadList } from './ThreadList.js';
import { useThreads } from '../BbsService.js';

vi.mock('@gxp/design-system', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('./ThreadItem.js', () => ({
  ThreadItem: ({ thread }: { thread: { id: string; title: string } }) => (
    <div data-testid={`thread-${thread.id}`}>{thread.title}</div>
  ),
}));

vi.mock('../BbsService.js', () => ({
  useThreads: vi.fn(),
}));

const useThreadsMock = vi.mocked(useThreads);

describe('ThreadList', () => {
  it('renders loading skeletons', () => {
    useThreadsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<ThreadList />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('renders error state', () => {
    useThreadsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });

    render(<ThreadList />);

    expect(screen.getByText(/failed to load threads/i)).toBeTruthy();
  });

  it('renders empty state when no threads', () => {
    useThreadsMock.mockReturnValue({
      data: { threads: [] },
      isLoading: false,
      error: null,
    });

    render(<ThreadList />);

    expect(screen.getByText(/no threads found/i)).toBeTruthy();
  });

  it('renders thread items', () => {
    useThreadsMock.mockReturnValue({
      data: {
        threads: [
          { id: 't1', title: 'First thread' },
          { id: 't2', title: 'Second thread' },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-t1')).toBeTruthy();
    expect(screen.getByTestId('thread-t2')).toBeTruthy();
  });
});
