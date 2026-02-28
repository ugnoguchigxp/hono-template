import { randomUUID } from 'node:crypto';
import type { CreateThreadInput, Thread as ThreadType, UserId } from '../../contracts.js';
import { Thread as ThreadEntity } from '../../domain/entities/Thread.js';
import type { IThreadRepository } from '../ports.js';

export class CreateThreadUseCase {
  constructor(private readonly threadRepo: IThreadRepository) {}

  async execute(authorId: UserId, input: CreateThreadInput): Promise<ThreadType> {
    const thread = ThreadEntity.create({
      id: randomUUID(),
      title: input.title,
      content: input.content,
      authorId,
    });

    const saved = await this.threadRepo.save(thread);
    return saved.getData();
  }
}
