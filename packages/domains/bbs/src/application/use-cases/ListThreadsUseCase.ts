import type { ThreadListResponse, ThreadResource } from '../../contracts.js';
import type { Thread as ThreadEntity } from '../../domain/entities/Thread.js';
import type { IThreadRepository } from '../ports.js';

export class ListThreadsUseCase {
  constructor(private readonly threadRepo: IThreadRepository) {}

  async execute(): Promise<ThreadListResponse> {
    const threads = await this.threadRepo.findAll();
    // Sort by createdAt descending
    const items: ThreadResource[] = (threads as ThreadEntity[])
      .sort((a, b) => b.getData().createdAt.getTime() - a.getData().createdAt.getTime())
      .map((t) => ({ ...t.getData(), kind: 'Thread', commentIds: [] }));

    return { items };
  }
}
