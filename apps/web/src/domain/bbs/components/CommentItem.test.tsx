import React from 'react';
import { render, screen } from '@testing-library/react';
import { CommentItem } from './CommentItem.js';

describe('CommentItem', () => {
  it('renders comment content and author snippet', () => {
    render(
      <CommentItem
        comment={{
          id: 'c1',
          content: 'Nice post!',
          authorId: 'author-12345678',
          createdAt: '2024-01-01T00:00:00.000Z',
        }}
      />
    );

    expect(screen.getByText('Nice post!')).toBeTruthy();
    expect(screen.getByText(/author-12/)).toBeTruthy();
  });
});
