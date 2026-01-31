export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface ThreadDetail extends Thread {
  comments: Comment[];
}

export interface CreateThreadInput {
  title: string;
  content: string;
}

export interface PostCommentInput {
  content: string;
}

export interface ListThreadsResponse {
  threads: Thread[];
  total: number;
}
