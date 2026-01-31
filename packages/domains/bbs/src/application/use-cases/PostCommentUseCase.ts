import { ICommentRepository, IThreadRepository } from '../ports.js';
import { Comment as CommentEntity } from '../../domain/entities/Comment.js';
import { PostCommentInput, Comment as CommentType, ThreadId, UserId } from '../../contracts.js';
import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@foundation/app-core/errors';

export class PostCommentUseCase {
  constructor(
    private readonly threadRepo: IThreadRepository,
    private readonly commentRepo: ICommentRepository
  ) {}

  async execute(
    threadId: ThreadId,
    authorId: UserId,
    input: PostCommentInput
  ): Promise<CommentType> {
    // Verify thread exists
    const thread = await this.threadRepo.findById(threadId);
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    // Verify parent comment exists if provided
    if (input.parentId) {
      const parent = await this.commentRepo.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError('Parent comment not found');
      }
      if (parent.threadId !== threadId) {
        throw new Error('Parent comment belongs to a different thread');
      }
    }

    const comment = CommentEntity.create({
      id: randomUUID(),
      threadId,
      authorId,
      parentId: input.parentId,
      content: input.content,
    });

    const saved = await this.commentRepo.save(comment);
    return saved.getData();
  }
}
