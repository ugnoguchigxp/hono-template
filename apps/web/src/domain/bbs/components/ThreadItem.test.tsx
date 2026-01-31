import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ThreadItem } from './ThreadItem.js';

vi.mock('@gxp/design-system', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

describe('ThreadItem', () => {
  it('renders thread metadata', () => {
    render(
      <ThreadItem
        thread={{
          id: 't1',
          title: 'Hello world',
          content: 'Some content here',
          authorId: 'author-12345678',
          commentCount: 3,
          createdAt: '2024-01-01T00:00:00.000Z',
        }}
      />
    );

    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(screen.getByText('Some content here')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/read more/i)).toBeTruthy();
  });
});
