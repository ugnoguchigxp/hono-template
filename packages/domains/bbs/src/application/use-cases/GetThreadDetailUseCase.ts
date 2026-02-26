import { NotFoundError } from '@foundation/app-core/errors';
import type { CommentResource, ThreadId, ThreadListResponse } from '../../contracts.js';
import type { ICommentRepository, IThreadRepository } from '../ports.js';

export class GetThreadDetailUseCase {
  constructor(
    private readonly threadRepo: IThreadRepository,
    private readonly commentRepo: ICommentRepository
  ) {}

  async execute(threadId: ThreadId): Promise<ThreadListResponse> {
    const thread = await this.threadRepo.findById(threadId);
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const comments = await this.commentRepo.findByThreadId(threadId);
    const commentData = comments.map((comment) => comment.getData());
    const rootCommentIds: string[] = [];
    const replyIdsMap = new Map<string, string[]>();

    for (const comment of commentData) {
      if (!comment.parentId) {
        rootCommentIds.push(comment.id);
        continue;
      }

      const replies = replyIdsMap.get(comment.parentId) ?? [];
      replies.push(comment.id);
      replyIdsMap.set(comment.parentId, replies);
    }

    const commentItems: CommentResource[] = commentData.map((comment) => ({
      ...comment,
      kind: 'Comment',
      replyIds: replyIdsMap.get(comment.id) ?? [],
    }));

    return {
      items: [{ ...thread.getData(), kind: 'Thread', commentIds: rootCommentIds }, ...commentItems],
    };
  }
}
