import type { Container, Logger } from '@foundation/app-core/types.js';
import type {
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  ValidateSessionUseCase,
} from '@foundation/auth-suite/application/index.js';
import type {
  CreateThreadUseCase,
  GetThreadDetailUseCase,
  ListThreadsUseCase,
  PostCommentUseCase,
} from '@domains/bbs';
import { Hono } from 'hono';
import {
  createHealthCheckHandler,
  createLoginHandler,
  createLogoutHandler,
  createMeHandler,
  createRegisterHandler,
} from './handlers/index.js';
import {
  createCreateThreadHandler,
  createListThreadsHandler,
  createPostCommentHandler,
  createThreadDetailHandler,
} from './handlers/bbs.js';
import {
  authMiddleware,
  createErrorHandler,
  createZodErrorHandler,
  requestContextMiddleware,
} from './middleware/index.js';

export interface HonoAppDependencies {
  container: Container;
  logger: Logger;
  loginUseCase: LoginUseCase;
  registerUserUseCase: RegisterUserUseCase;
  validateSessionUseCase: ValidateSessionUseCase;
  logoutUseCase: LogoutUseCase;
  listThreadsUseCase: ListThreadsUseCase;
  createThreadUseCase: CreateThreadUseCase;
  getThreadDetailUseCase: GetThreadDetailUseCase;
  postCommentUseCase: PostCommentUseCase;
}

export function createHonoApp(dependencies: HonoAppDependencies): Hono {
  const app = new Hono();

  // Set global dependencies
  app.use('*', async (c, next) => {
    c.set('logger', dependencies.logger);
    c.set('container', dependencies.container);
    await next();
  });

  // Global middleware
  app.use('*', requestContextMiddleware());

  // Error handling
  app.onError(createErrorHandler());
  app.onError(createZodErrorHandler());

  // Health check (no auth required)
  app.get('/health', createHealthCheckHandler());

  // Auth routes
  const authRoutes = new Hono();

  authRoutes.post('/login', createLoginHandler(dependencies.loginUseCase));
  authRoutes.post('/register', createRegisterHandler(dependencies.registerUserUseCase));

  // Protected routes
  const protectedRoutes = new Hono();
  protectedRoutes.use('*', authMiddleware(dependencies.validateSessionUseCase));
  protectedRoutes.post('/logout', createLogoutHandler(dependencies.logoutUseCase));
  protectedRoutes.get('/me', createMeHandler());

  authRoutes.route('/', protectedRoutes);

  // API v1 routes
  const apiV1 = new Hono();
  apiV1.route('/auth', authRoutes);

  // BBS routes
  const bbsRoutes = new Hono();
  bbsRoutes.get('/threads', createListThreadsHandler(dependencies.listThreadsUseCase));
  bbsRoutes.get('/threads/:id', createThreadDetailHandler(dependencies.getThreadDetailUseCase));
  
  // Protected BBS routes
  const protectedBbs = new Hono();
  protectedBbs.use('*', authMiddleware(dependencies.validateSessionUseCase));
  protectedBbs.post('/threads', createCreateThreadHandler(dependencies.createThreadUseCase));
  protectedBbs.post('/threads/:id/comments', createPostCommentHandler(dependencies.postCommentUseCase));
  
  bbsRoutes.route('/', protectedBbs);
  apiV1.route('/bbs', bbsRoutes);

  app.route('/api/v1', apiV1);

  // Root redirect to health
  app.get('/', (c) => c.redirect('/health'));

  return app;
}
