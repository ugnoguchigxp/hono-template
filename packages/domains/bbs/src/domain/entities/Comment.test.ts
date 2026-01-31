import { describe, it, expect } from 'vitest';
import { Comment } from './Comment.js';
import { randomUUID } from 'node:crypto';

describe('Comment Entity', () => {
  const authorId = randomUUID() as any;
  const threadId = randomUUID() as any;
  const commentId = randomUUID() as any;

  it('should create a new comment', () => {
    const comment = Comment.create({
      id: commentId,
      threadId,
      authorId,
      content: 'Test comment',
    });

    const data = comment.getData();
    expect(data.id).toBe(commentId);
    expect(data.threadId).toBe(threadId);
    expect(data.content).toBe('Test comment');
    expect(data.parentId).toBeUndefined();
  });

  it('should create a reply comment', () => {
    const parentId = randomUUID() as any;
    const comment = Comment.create({
      id: commentId,
      threadId,
      authorId,
      parentId,
      content: 'Reply comment',
    });

    expect(comment.parentId).toBe(parentId);
  });
});
