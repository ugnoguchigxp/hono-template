import type {
  CreateThreadUseCase,
  GetThreadDetailUseCase,
  ListThreadsUseCase,
  PostCommentUseCase,
} from '@domains/bbs';
import type { Container, Logger } from '@foundation/app-core';
import type {
  ExternalAuthUseCase,
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  ValidateSessionUseCase,
  VerifyMfaUseCase,
} from '@foundation/auth-suite/application';
import type { IOAuthClient } from '@foundation/auth-suite/application';
import type { DBClient } from '@foundation/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import {
  createCreateThreadHandler,
  createListThreadsHandler,
  createPostCommentHandler,
  createThreadDetailHandler,
} from './handlers/bbs.js';
import {
  createCreateChatMessageHandler,
  createCreateChatSessionHandler,
  createDeleteChatSessionHandler,
  createGetChatSessionHandler,
  createIngestChatMessageHandler,
  createListChatMessagesHandler,
  createListChatSessionsHandler,
  createSearchChatMessagesHandler,
  createUpdateChatSessionHandler,
} from './handlers/chat-sessions.js';
import {
  createHealthCheckHandler,
  createLoginHandler,
  createLogoutHandler,
  createMeHandler,
  createOAuthCallbackHandler,
  createOAuthLoginHandler,
  createRegisterHandler,
  createVerifyMfaHandler,
} from './handlers/index.js';
import {
  authMiddleware,
  createZodErrorHandler,
  requestContextMiddleware,
} from './middleware/index.js';

export interface HonoAppDependencies {
  container: Container;
  logger: Logger;
  dbClient: DBClient;
  loginUseCase: LoginUseCase;
  registerUserUseCase: RegisterUserUseCase;
  validateSessionUseCase: ValidateSessionUseCase;
  logoutUseCase: LogoutUseCase;
  verifyMfaUseCase: VerifyMfaUseCase;
  externalAuthUseCase: ExternalAuthUseCase;
  oauthClients: Map<string, IOAuthClient>;
  listThreadsUseCase: ListThreadsUseCase;
  createThreadUseCase: CreateThreadUseCase;
  getThreadDetailUseCase: GetThreadDetailUseCase;
  postCommentUseCase: PostCommentUseCase;
}
export type AppEnv = {
  Variables: {
    logger: Logger;
    container: Container;
    user?: any; // Will be properly typed when needed
  };
};

export function createHonoApp(dependencies: HonoAppDependencies): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Standard Hono middleware
  app.use('*', cors());
  app.use('*', secureHeaders());
  app.use('*', prettyJSON());
  app.use('*', timing());
  app.use('*', poweredBy());

  // Set global dependencies
  app.use('*', async (c, next) => {
    c.set('logger', dependencies.logger);
    c.set('container', dependencies.container);
    await next();
  });

  // Global middleware
  app.use('*', requestContextMiddleware());

  // Error handling (Zod handler wraps generic one)
  app.onError(createZodErrorHandler());

  // Health check (no auth required)
  app.get('/health', createHealthCheckHandler());

  // Auth routes
  const authRoutes = new Hono<AppEnv>();

  authRoutes.post('/login', createLoginHandler(dependencies.loginUseCase));
  authRoutes.post('/register', createRegisterHandler(dependencies.registerUserUseCase));
  authRoutes.post('/verify-mfa', createVerifyMfaHandler(dependencies.verifyMfaUseCase));

  // OAuth routes
  authRoutes.get('/login/:provider', createOAuthLoginHandler(dependencies.oauthClients));
  authRoutes.get(
    '/callback/:provider',
    createOAuthCallbackHandler(dependencies.oauthClients, dependencies.externalAuthUseCase)
  );

  // Protected routes
  const protectedRoutes = new Hono<AppEnv>();
  protectedRoutes.use('*', authMiddleware(dependencies.validateSessionUseCase));
  protectedRoutes.post('/logout', createLogoutHandler(dependencies.logoutUseCase));
  protectedRoutes.get('/me', createMeHandler());

  authRoutes.route('/', protectedRoutes);

  // API v1 routes
  const apiV1 = new Hono<AppEnv>();
  apiV1.route('/auth', authRoutes);

  // BBS routes
  const bbsRoutes = new Hono<AppEnv>();
  bbsRoutes.get('/threads', createListThreadsHandler(dependencies.listThreadsUseCase));
  bbsRoutes.get('/threads/:id', createThreadDetailHandler(dependencies.getThreadDetailUseCase));

  // Protected BBS routes
  const protectedBbs = new Hono<AppEnv>();
  protectedBbs.use('*', authMiddleware(dependencies.validateSessionUseCase));
  protectedBbs.post('/threads', createCreateThreadHandler(dependencies.createThreadUseCase));
  protectedBbs.post(
    '/threads/:id/comments',
    createPostCommentHandler(dependencies.postCommentUseCase)
  );

  bbsRoutes.route('/', protectedBbs);
  apiV1.route('/bbs', bbsRoutes);

  // Chat session storage routes
  const chatRoutes = new Hono<AppEnv>();
  chatRoutes.get('/sessions', createListChatSessionsHandler(dependencies.dbClient));
  chatRoutes.post('/sessions', createCreateChatSessionHandler(dependencies.dbClient));
  chatRoutes.get('/sessions/:id', createGetChatSessionHandler(dependencies.dbClient));
  chatRoutes.patch('/sessions/:id', createUpdateChatSessionHandler(dependencies.dbClient));
  chatRoutes.delete('/sessions/:id', createDeleteChatSessionHandler(dependencies.dbClient));
  chatRoutes.get('/sessions/:id/messages', createListChatMessagesHandler(dependencies.dbClient));
  chatRoutes.post('/sessions/:id/messages', createCreateChatMessageHandler(dependencies.dbClient));
  chatRoutes.post('/ingest', createIngestChatMessageHandler(dependencies.dbClient));
  chatRoutes.get('/messages/search', createSearchChatMessagesHandler(dependencies.dbClient));
  apiV1.route('/chat', chatRoutes);

  app.route('/api/v1', apiV1);

  // Root redirect to health
  app.get('/', (c) => c.redirect('/health'));

  return app;
}
