import { eq } from 'drizzle-orm';
import { comments, Comment as CommentRow } from '@foundation/db/schema';
import { ICommentRepository, Comment as CommentEntity, CommentId, ThreadId } from '@domains/bbs';
import { DatabaseClient } from '@foundation/db';

export class DrizzleCommentRepository implements ICommentRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: CommentId): Promise<CommentEntity | null> {
    const result = await this.db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!result) {
      return null;
    }

    return CommentEntity.reconstruct({
      id: result.id as CommentId,
      threadId: result.threadId as ThreadId,
      parentId: (result.parentId as CommentId) ?? null,
      content: result.content,
      authorId: result.authorId as any,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async findByThreadId(threadId: ThreadId): Promise<CommentEntity[]> {
    const results = await this.db.query.comments.findMany({
      where: eq(comments.threadId, threadId),
    });

    return results.map(result =>
      CommentEntity.reconstruct({
        id: result.id as CommentId,
        threadId: result.threadId as ThreadId,
        parentId: (result.parentId as CommentId) ?? null,
        content: result.content,
        authorId: result.authorId as any,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      })
    );
  }

  async save(comment: CommentEntity): Promise<CommentEntity> {
    const data = comment.getData();

    await this.db
      .insert(comments)
      .values({
        id: data.id,
        threadId: data.threadId,
        parentId: data.parentId,
        content: data.content,
        authorId: data.authorId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .onConflictDoUpdate({
        target: comments.id,
        set: {
          content: data.content,
          updatedAt: data.updatedAt,
        },
      });

    return comment;
  }

  async delete(id: CommentId): Promise<void> {
    await this.db.delete(comments).where(eq(comments.id, id));
  }
}
