import { describe, it, expect, vi } from 'vitest';
import { PostCommentUseCase } from './PostCommentUseCase.js';
import { Thread } from '../../domain/entities/Thread.js';
import { Comment } from '../../domain/entities/Comment.js';
import { randomUUID } from 'node:crypto';

describe('PostCommentUseCase', () => {
  const mockThreadRepo = {
    findById: vi.fn(),
  };
  const mockCommentRepo = {
    findById: vi.fn(),
    save: vi.fn(),
  };

  const useCase = new PostCommentUseCase(mockThreadRepo as any, mockCommentRepo as any);

  it('should post a root comment to a thread', async () => {
    const threadId = randomUUID() as any;
    const authorId = randomUUID() as any;
    const thread = Thread.create({ id: threadId, title: 'Thread', authorId: randomUUID() as any });

    mockThreadRepo.findById.mockResolvedValue(thread);
    mockCommentRepo.save.mockImplementation((c) => Promise.resolve(c));

    const result = await useCase.execute(threadId, authorId, {
      content: 'New root comment',
    });

    expect(result.content).toBe('New root comment');
    expect(result.threadId).toBe(threadId);
    expect(result.authorId).toBe(authorId);
    expect(mockCommentRepo.save).toHaveBeenCalled();
  });

  it('should post a reply to an existing comment', async () => {
    const threadId = 't1' as any;
    const authorId = 'u1' as any;
    const parentId = 'c1' as any;
    const thread = Thread.create({ id: threadId, title: 'Thread', authorId: 'admin' as any });
    const parent = Comment.create({ id: parentId, threadId, authorId: 'other' as any, content: 'root' });

    mockThreadRepo.findById.mockResolvedValue(thread);
    mockCommentRepo.findById.mockResolvedValue(parent);
    mockCommentRepo.save.mockImplementation((c) => Promise.resolve(c));

    const result = await useCase.execute(threadId, authorId, {
      content: 'Reply',
      parentId,
    });

    expect(result.parentId).toBe(parentId);
  });

  it('should throw error if parent comment belongs to different thread', async () => {
    const threadId = 't1' as any;
    const parentId = 'c1' as any;
    const thread = Thread.create({ id: threadId, title: 'Thread', authorId: 'admin' as any });
    const parent = Comment.create({ id: parentId, threadId: 'other-thread' as any, authorId: 'other' as any, content: 'root' });

    mockThreadRepo.findById.mockResolvedValue(thread);
    mockCommentRepo.findById.mockResolvedValue(parent);

    await expect(useCase.execute(threadId, 'u1' as any, {
      content: 'Reply',
      parentId,
    })).rejects.toThrow('Parent comment belongs to a different thread');
  });
});
