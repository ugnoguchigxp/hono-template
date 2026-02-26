import { describe, it, expect, vi } from 'vitest';
import { GetThreadDetailUseCase } from './GetThreadDetailUseCase.js';
import { Thread } from '../../domain/entities/Thread.js';
import { Comment } from '../../domain/entities/Comment.js';
import { randomUUID } from 'node:crypto';

describe('GetThreadDetailUseCase', () => {
  const mockThreadRepo = {
    findById: vi.fn(),
  };
  const mockCommentRepo = {
    findByThreadId: vi.fn(),
  };

  const useCase = new GetThreadDetailUseCase(mockThreadRepo as any, mockCommentRepo as any);

  it('should return thread detail as a flat resource list', async () => {
    const threadId = randomUUID() as any;
    const authorId = randomUUID() as any;
    const thread = Thread.create({ id: threadId, title: 'Thread', authorId });

    const comment1 = Comment.create({ id: 'c1' as any, threadId, authorId, content: 'root' });
    const comment2 = Comment.create({ id: 'c2' as any, threadId, authorId, parentId: 'c1' as any, content: 'reply' });
    const comment3 = Comment.create({ id: 'c3' as any, threadId, authorId, content: 'root2' });

    mockThreadRepo.findById.mockResolvedValue(thread);
    mockCommentRepo.findByThreadId.mockResolvedValue([comment1, comment2, comment3]);

    const result = await useCase.execute(threadId);
    const threadItem = result.items.find((item) => item.kind === 'Thread');
    const c1 = result.items.find((item) => item.kind === 'Comment' && item.id === 'c1');
    const c2 = result.items.find((item) => item.kind === 'Comment' && item.id === 'c2');

    expect(threadItem).toBeDefined();
    expect(threadItem?.id).toBe(threadId);
    expect(threadItem?.kind).toBe('Thread');
    if (threadItem?.kind === 'Thread') {
      expect(threadItem.commentIds).toEqual(['c1', 'c3']);
    }

    expect(c1).toBeDefined();
    if (c1?.kind === 'Comment') {
      expect(c1.replyIds).toEqual(['c2']);
    }

    expect(c2).toBeDefined();
    if (c2?.kind === 'Comment') {
      expect(c2.replyIds).toEqual([]);
    }
  });

  it('should throw NotFoundError if thread does not exist', async () => {
    mockThreadRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('none' as any)).rejects.toThrow('Thread not found');
  });
});
