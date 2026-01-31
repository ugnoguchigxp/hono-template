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

  it('should return thread detail with nested comment tree', async () => {
    const threadId = randomUUID() as any;
    const authorId = randomUUID() as any;
    const thread = Thread.create({ id: threadId, title: 'Thread', authorId });

    const comment1 = Comment.create({ id: 'c1' as any, threadId, authorId, content: 'root' });
    const comment2 = Comment.create({ id: 'c2' as any, threadId, authorId, parentId: 'c1' as any, content: 'reply' });
    const comment3 = Comment.create({ id: 'c3' as any, threadId, authorId, content: 'root2' });

    mockThreadRepo.findById.mockResolvedValue(thread);
    mockCommentRepo.findByThreadId.mockResolvedValue([comment1, comment2, comment3]);

    const result = await useCase.execute(threadId);

    expect(result.id).toBe(threadId);
    expect(result.comments).toHaveLength(2); // Two root comments
    expect(result.comments[0].id).toBe('c1');
    expect(result.comments[0].replies).toHaveLength(1);
    expect(result.comments[0].replies[0].id).toBe('c2');
  });

  it('should throw NotFoundError if thread does not exist', async () => {
    mockThreadRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('none' as any)).rejects.toThrow('Thread not found');
  });
});
