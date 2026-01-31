import { IThreadRepository, ICommentRepository } from '../ports.js';
import { ThreadId, ThreadDetail, CommentNode } from '../../contracts.js';
import { NotFoundError } from '@foundation/app-core/errors';

export class GetThreadDetailUseCase {
  constructor(
    private readonly threadRepo: IThreadRepository,
    private readonly commentRepo: ICommentRepository
  ) {}

  async execute(threadId: ThreadId): Promise<ThreadDetail> {
    const thread = await this.threadRepo.findById(threadId);
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const comments = await this.commentRepo.findByThreadId(threadId);
    const commentNodes: CommentNode[] = comments.map(c => ({
      ...c.getData(),
      replies: [],
    }));

    return {
      ...thread.getData(),
      comments: this.buildCommentTree(commentNodes),
    };
  }

  private buildCommentTree(nodes: CommentNode[]): CommentNode[] {
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    nodes.forEach(node => {
      map.set(node.id, node);
    });

    nodes.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
