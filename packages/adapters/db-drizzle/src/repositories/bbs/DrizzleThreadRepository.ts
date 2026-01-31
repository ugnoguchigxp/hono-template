import { eq } from 'drizzle-orm';
import { threads, Thread as ThreadRow } from '@foundation/db/schema';
import { IThreadRepository, Thread as ThreadEntity, ThreadId } from '@domains/bbs';
import { DatabaseClient } from '@foundation/db';

export class DrizzleThreadRepository implements IThreadRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: ThreadId): Promise<ThreadEntity | null> {
    const result = await this.db.query.threads.findFirst({
      where: eq(threads.id, id),
    });

    if (!result) {
      return null;
    }

    return ThreadEntity.reconstruct({
      id: result.id as ThreadId,
      title: result.title,
      content: result.content ?? undefined,
      authorId: result.authorId as any,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async findAll(): Promise<ThreadEntity[]> {
    const results = await this.db.query.threads.findMany();

    return results.map(result =>
      ThreadEntity.reconstruct({
        id: result.id as ThreadId,
        title: result.title,
        content: result.content ?? undefined,
        authorId: result.authorId as any,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      })
    );
  }

  async save(thread: ThreadEntity): Promise<ThreadEntity> {
    const data = thread.getData();

    await this.db
      .insert(threads)
      .values({
        id: data.id,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .onConflictDoUpdate({
        target: threads.id,
        set: {
          title: data.title,
          content: data.content,
          updatedAt: data.updatedAt,
        },
      });

    return thread;
  }

  async delete(id: ThreadId): Promise<void> {
    await this.db.delete(threads).where(eq(threads.id, id));
  }
}
