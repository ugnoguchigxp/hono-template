import { describe, it, expect, vi } from 'vitest';
import { ListThreadsUseCase } from './ListThreadsUseCase.js';
import { Thread } from '../../domain/entities/Thread.js';
import { randomUUID } from 'node:crypto';

describe('ListThreadsUseCase', () => {
  const mockRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  const useCase = new ListThreadsUseCase(mockRepo as any);

  it('should return a list of threads sorted by date descending', async () => {
    const thread1 = Thread.create({
      id: randomUUID() as any,
      title: 'Old',
      authorId: randomUUID() as any,
    });
    // Manually set date to older
    (thread1 as any).data.createdAt = new Date('2023-01-01');

    const thread2 = Thread.create({
      id: randomUUID() as any,
      title: 'New',
      authorId: randomUUID() as any,
    });
    (thread2 as any).data.createdAt = new Date('2023-01-02');

    mockRepo.findAll.mockResolvedValue([thread1, thread2]);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('New');
    expect(result[1].title).toBe('Old');
  });
});
