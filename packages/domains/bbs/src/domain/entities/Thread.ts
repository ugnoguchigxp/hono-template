import { ThreadId, UserId, Thread as ThreadType } from '../../contracts.js';

export class Thread {
  private constructor(private readonly data: ThreadType) {}

  static create(data: {
    id: ThreadId;
    title: string;
    content?: string;
    authorId: UserId;
  }): Thread {
    return new Thread({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: ThreadType): Thread {
    return new Thread(data);
  }

  getData(): ThreadType {
    return { ...this.data };
  }

  update(title: string, content?: string): Thread {
    return new Thread({
      ...this.data,
      title,
      content,
      updatedAt: new Date(),
    });
  }

  get id(): ThreadId { return this.data.id; }
  get authorId(): UserId { return this.data.authorId; }
}
