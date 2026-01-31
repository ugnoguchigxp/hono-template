import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ThreadForm } from './ThreadForm.js';
import { useCreateThread } from '../BbsService.js';

vi.mock('@gxp/design-system', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../BbsService.js', () => ({
  useCreateThread: vi.fn(),
}));

const useCreateThreadMock = vi.mocked(useCreateThread);

describe('ThreadForm', () => {
  it('shows validation messages on empty submit', async () => {
    useCreateThreadMock.mockReturnValue({
      mutateAsync: vi.fn(),
    });

    const user = userEvent.setup();
    render(<ThreadForm />);

    await user.click(screen.getByRole('button', { name: /create thread/i }));

    expect(screen.getByText(/title must be at least 5 characters/i)).toBeTruthy();
    expect(screen.getByText(/content must be at least 10 characters/i)).toBeTruthy();
  });

  it('submits valid data and calls onSuccess', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onSuccess = vi.fn();
    useCreateThreadMock.mockReturnValue({
      mutateAsync,
    });

    const user = userEvent.setup();
    render(<ThreadForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/what's on your mind/i), 'Hello there');
    await user.type(screen.getByPlaceholderText(/provide more details/i), 'This is valid content.');
    await user.click(screen.getByRole('button', { name: /create thread/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        title: 'Hello there',
        content: 'This is valid content.',
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });
});
