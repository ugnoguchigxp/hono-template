import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CommentForm } from './CommentForm.js';
import { usePostComment } from '../BbsService.js';

vi.mock('@gxp/design-system', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

vi.mock('../BbsService.js', () => ({
  usePostComment: vi.fn(),
}));

const usePostCommentMock = vi.mocked(usePostComment);

describe('CommentForm', () => {
  it('submits a comment', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    usePostCommentMock.mockReturnValue({
      mutateAsync,
    });

    const user = userEvent.setup();
    render(<CommentForm threadId="thread-1" />);

    await user.type(screen.getByPlaceholderText(/add a comment/i), 'Nice post!');
    await user.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ content: 'Nice post!' });
    });
  });
});
