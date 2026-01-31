import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ThreadDetail } from './ThreadDetail.js';
import { useThread } from '../BbsService.js';

vi.mock('@gxp/design-system', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Separator: () => <div data-testid="separator" />,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('./CommentForm.js', () => ({
  CommentForm: ({ threadId }: { threadId: string }) => (
    <div data-testid={`comment-form-${threadId}`} />
  ),
}));

vi.mock('./CommentItem.js', () => ({
  CommentItem: ({ comment }: { comment: { id: string; content: string } }) => (
    <div data-testid={`comment-${comment.id}`}>{comment.content}</div>
  ),
}));

vi.mock('../BbsService.js', () => ({
  useThread: vi.fn(),
}));

const useThreadMock = vi.mocked(useThread);

describe('ThreadDetail', () => {
  it('renders loading skeletons', () => {
    useThreadMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<ThreadDetail threadId="t1" />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    useThreadMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });

    render(<ThreadDetail threadId="t1" />);

    expect(screen.getByText(/failed to load thread details/i)).toBeTruthy();
    expect(screen.getByText(/go back to bbs/i)).toBeTruthy();
  });

  it('renders thread content and comments', () => {
    useThreadMock.mockReturnValue({
      data: {
        id: 't1',
        title: 'Thread title',
        content: 'Thread content',
        authorId: 'author-12345678',
        createdAt: '2024-01-01T00:00:00.000Z',
        comments: [
          { id: 'c1', content: 'First', authorId: 'a1', createdAt: '2024-01-01T00:00:00.000Z' },
          { id: 'c2', content: 'Second', authorId: 'a2', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<ThreadDetail threadId="t1" />);

    expect(screen.getByText('Thread title')).toBeTruthy();
    expect(screen.getByText('Thread content')).toBeTruthy();
    expect(screen.getByText(/comments \\(2\\)/i)).toBeTruthy();
    expect(screen.getByTestId('comment-c1')).toBeTruthy();
    expect(screen.getByTestId('comment-c2')).toBeTruthy();
    expect(screen.getByTestId('comment-form-t1')).toBeTruthy();
  });

  it('renders empty comment message when no comments', () => {
    useThreadMock.mockReturnValue({
      data: {
        id: 't2',
        title: 'Empty comments',
        content: 'Nothing here',
        authorId: 'author-12345678',
        createdAt: '2024-01-01T00:00:00.000Z',
        comments: [],
      },
      isLoading: false,
      error: null,
    });

    render(<ThreadDetail threadId="t2" />);

    expect(screen.getByText(/no comments yet/i)).toBeTruthy();
  });
});
