import type { Thread as ThreadType } from '../../contracts.js';
import type { Thread as ThreadEntity } from '../../domain/entities/Thread.js';
import type { IThreadRepository } from '../ports.js';

export class ListThreadsUseCase {
  constructor(private readonly threadRepo: IThreadRepository) {}

  async execute(): Promise<ThreadType[]> {
    const threads = await this.threadRepo.findAll();
    // Sort by createdAt descending
    return (threads as ThreadEntity[])
      .sort((a, b) => b.getData().createdAt.getTime() - a.getData().createdAt.getTime())
      .map((t) => t.getData());
  }
}
