import { IThreadRepository } from '../ports.js';
import { Thread as ThreadEntity } from '../../domain/entities/Thread.js';
import { Thread as ThreadType } from '../../contracts.js';

export class ListThreadsUseCase {
  constructor(private readonly threadRepo: IThreadRepository) {}

  async execute(): Promise<ThreadType[]> {
    const threads = await this.threadRepo.findAll();
    // Sort by createdAt descending
    return (threads as ThreadEntity[])
      .sort((a, b) => b.getData().createdAt.getTime() - a.getData().createdAt.getTime())
      .map(t => t.getData());
  }
}
