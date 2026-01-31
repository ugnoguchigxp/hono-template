import { CommentId, ThreadId, UserId } from '../contracts.js';
import { Thread as ThreadEntity } from '../domain/entities/Thread.js';
import { Comment as CommentEntity } from '../domain/entities/Comment.js';

export interface IThreadRepository {
  findById(id: ThreadId): Promise<ThreadEntity | null>;
  findAll(): Promise<ThreadEntity[]>;
  save(thread: ThreadEntity): Promise<ThreadEntity>;
  delete(id: ThreadId): Promise<void>;
}

export interface ICommentRepository {
  findById(id: CommentId): Promise<CommentEntity | null>;
  findByThreadId(threadId: ThreadId): Promise<CommentEntity[]>;
  save(comment: CommentEntity): Promise<CommentEntity>;
  delete(id: CommentId): Promise<void>;
}
