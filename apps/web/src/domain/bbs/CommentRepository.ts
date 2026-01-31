import { Comment, PostCommentInput } from './types.js';

const API_BASE_URL = '/api/v1/bbs';

export class CommentRepository {
  async create(threadId: string, input: PostCommentInput): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error('Failed to post comment');
    }
    return response.json();
  }
}
