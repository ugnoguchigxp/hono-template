import type {
  CreateThreadUseCase,
  GetThreadDetailUseCase,
  ListThreadsUseCase,
  PostCommentUseCase,
} from '@domains/bbs';
import type { Handler } from 'hono';

export const createListThreadsHandler = (useCase: ListThreadsUseCase): Handler => async (c) => {
  const threads = await useCase.execute();
  return c.json({ data: threads });
};

export const createThreadDetailHandler = (useCase: GetThreadDetailUseCase): Handler => async (c) => {
  const id = c.req.param('id');
  const threadDetail = await useCase.execute(id);
  return c.json({ data: threadDetail });
};

export const createCreateThreadHandler = (useCase: CreateThreadUseCase): Handler => async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const input = await c.req.json();
  const thread = await useCase.execute(user.id, input);
  return c.json({ data: thread }, 201);
};

export const createPostCommentHandler = (useCase: PostCommentUseCase): Handler => async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const threadId = c.req.param('id');
  const input = await c.req.json();
  const comment = await useCase.execute(threadId, user.id, input);
  return c.json({ data: comment }, 201);
};
