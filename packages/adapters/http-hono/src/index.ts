import type { Container, Logger } from '@foundation/app-core/types.js';
import type {
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  ValidateSessionUseCase,
} from '@foundation/auth-suite/application/index.js';
import { Hono } from 'hono';
import {
  createHealthCheckHandler,
  createLoginHandler,
  createLogoutHandler,
  createMeHandler,
  createRegisterHandler,
} from './handlers/index.js';
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
}

export function createHonoApp(dependencies: HonoAppDependencies): Hono {
  const app = new Hono();

  // Global middleware
  app.use('*', requestContextMiddleware());

  // Set global dependencies
  app.use('*', async (c, next) => {
    c.set('logger', dependencies.logger);
    c.set('container', dependencies.container);
    await next();
  });

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
  app.route('/auth', authRoutes);

  // API v1 routes
  const apiV1 = new Hono();
  apiV1.route('/auth', authRoutes);

  app.route('/api/v1', apiV1);

  // Root redirect to health
  app.get('/', (c) => c.redirect('/health'));

  return app;
}
