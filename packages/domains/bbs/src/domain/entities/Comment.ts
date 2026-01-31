import { CommentId, ThreadId, UserId, Comment as CommentType } from '../../contracts.js';

export class Comment {
  private constructor(private readonly data: CommentType) {}

  static create(data: {
    id: CommentId;
    threadId: ThreadId;
    parentId?: CommentId | null;
    content: string;
    authorId: UserId;
  }): Comment {
    return new Comment({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: CommentType): Comment {
    return new Comment(data);
  }

  getData(): CommentType {
    return { ...this.data };
  }

  get id(): CommentId { return this.data.id; }
  get threadId(): ThreadId { return this.data.threadId; }
  get parentId(): CommentId | null | undefined { return this.data.parentId; }
}
