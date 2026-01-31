import { describe, it, expect } from 'vitest';
import { Thread } from './Thread.js';
import { randomUUID } from 'node:crypto';

describe('Thread Entity', () => {
  const authorId = randomUUID() as any;
  const threadId = randomUUID() as any;

  it('should create a new thread', () => {
    const thread = Thread.create({
      id: threadId,
      title: 'Hello World',
      content: 'This is a test thread',
      authorId,
    });

    const data = thread.getData();
    expect(data.id).toBe(threadId);
    expect(data.title).toBe('Hello World');
    expect(data.content).toBe('This is a test thread');
    expect(data.authorId).toBe(authorId);
    expect(data.createdAt).toBeInstanceOf(Date);
    expect(data.updatedAt).toBeInstanceOf(Date);
  });

  it('should update thread content', () => {
    const thread = Thread.create({
      id: threadId,
      title: 'Original Title',
      authorId,
    });

    const updated = thread.update('New Title', 'New Content');
    const data = updated.getData();

    expect(data.title).toBe('New Title');
    expect(data.content).toBe('New Content');
    expect(data.updatedAt.getTime()).toBeGreaterThanOrEqual(updated.getData().createdAt.getTime());
  });

  it('should reconstruct a thread from data', () => {
    const now = new Date();
    const thread = Thread.reconstruct({
      id: threadId,
      title: 'Reconstructed',
      authorId,
      createdAt: now,
      updatedAt: now,
    });

    expect(thread.id).toBe(threadId);
    expect(thread.getData().title).toBe('Reconstructed');
  });
});
