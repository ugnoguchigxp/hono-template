import { describe, it, expect, vi } from 'vitest';
import { CreateThreadUseCase } from './CreateThreadUseCase.js';
import { randomUUID } from 'node:crypto';

describe('CreateThreadUseCase', () => {
  const mockRepo = {
    save: vi.fn(),
  };

  const useCase = new CreateThreadUseCase(mockRepo as any);

  it('should create and save a new thread', async () => {
    const authorId = randomUUID() as any;
    const input = {
      title: 'Test Thread',
      content: 'Test Content',
    };

    mockRepo.save.mockImplementation((thread) => Promise.resolve(thread));

    const result = await useCase.execute(authorId, input);

    expect(result.title).toBe('Test Thread');
    expect(result.authorId).toBe(authorId);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
