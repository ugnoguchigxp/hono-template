import {
  DrizzleAuditLogger,
  DrizzleSessionStore,
  DrizzleUserRepository,
  DrizzleThreadRepository,
  DrizzleCommentRepository,
} from '@adapters/db-drizzle/index.js';
import { Config } from '@foundation/app-core/config.js';
import { DIKeys, createContainer } from '@foundation/app-core/di/index.js';
import { createLogger } from '@foundation/app-core/logger.js';
import type { Logger } from '@foundation/app-core/types.js';
import {
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  ValidateSessionUseCase,
  VerifyMfaUseCase,
  ExternalAuthUseCase,
} from '@foundation/auth-suite/application/index.js';
import {
  createPasswordHasher,
  createTokenGenerator,
} from '@foundation/auth-suite/infrastructure/index.js';
import { createDBClient } from '@foundation/db/client.js';
import type { DBClient } from '@foundation/db/index.js';
import { createTransactionManager } from '@foundation/db/transaction/index.js';
import {
  CreateThreadUseCase,
  GetThreadDetailUseCase,
  ListThreadsUseCase,
  PostCommentUseCase,
} from '@domains/bbs';
import type { Container } from '@foundation/app-core/types.js';
import {
  GoogleOAuthClient,
  GitHubOAuthClient,
  MSALOAuthClient,
} from '@foundation/auth-suite/infrastructure/oauth/index.js';
import type { IOAuthClient } from '@foundation/auth-suite/application/ports.js';

export function bootstrapDI(): Container {
  // Config handles environment variables internally, 
  // but we pass process.env to be explicit if needed by some platforms.
  const config = new Config(process.env as Record<string, string>);
  const logger = createLogger(config.get('LOG_LEVEL'));
  const container = createContainer();

  // Register core singletons
  container.registerSingleton(DIKeys.Config, () => config);
  container.registerSingleton(DIKeys.Logger, () => logger);

  // Database setup
  const dbClient = createDBClient({
    url: config.get('DATABASE_URL'),
    maxConnections: 10,
    idleTimeout: 20,
  });

  container.registerSingleton(DIKeys.DatabaseClient, () => dbClient);
  container.registerSingleton(DIKeys.TransactionManager, () =>
    createTransactionManager(dbClient.getDrizzleDB())
  );

  return container;
}

/**
 * Helper to resolve all dependencies needed for the Hono app
 */
export function resolveHonoDependencies(container: Container) {
  const config = container.resolve<Config>(DIKeys.Config);
  const logger = container.resolve<Logger>(DIKeys.Logger);
  const dbClient = container.resolve<DBClient>(DIKeys.DatabaseClient);
  
  const passwordHasher = createPasswordHasher();
  const tokenGenerator = createTokenGenerator();
  const auditLogger = new DrizzleAuditLogger(dbClient, logger);
  const userRepository = new DrizzleUserRepository(dbClient);
  const sessionStore = new DrizzleSessionStore(dbClient);
  
  const threadRepository = new DrizzleThreadRepository(dbClient);
  const commentRepository = new DrizzleCommentRepository(dbClient);

  const sessionTtl = config.get('SESSION_TTL');

  // OAuth Clients
  const oauthClients = new Map<string, IOAuthClient>();

  // Google
  const googleId = config.get('GOOGLE_CLIENT_ID');
  const googleSecret = config.get('GOOGLE_CLIENT_SECRET');
  const googleRedirect = config.get('GOOGLE_REDIRECT_URI');
  if (googleId && googleSecret && googleRedirect) {
    oauthClients.set('google', new GoogleOAuthClient(googleId, googleSecret, googleRedirect));
  } else {
    logger.warn('Google OAuth disabled: configuration incomplete');
  }

  // GitHub
  const githubId = config.get('GITHUB_CLIENT_ID');
  const githubSecret = config.get('GITHUB_CLIENT_SECRET');
  const githubRedirect = config.get('GITHUB_REDIRECT_URI');
  if (githubId && githubSecret && githubRedirect) {
    oauthClients.set('github', new GitHubOAuthClient(githubId, githubSecret, githubRedirect));
  } else {
    logger.warn('GitHub OAuth disabled: configuration incomplete');
  }

  // MSAL
  const msalId = config.get('MSAL_CLIENT_ID');
  const msalSecret = config.get('MSAL_CLIENT_SECRET');
  const msalRedirect = config.get('MSAL_REDIRECT_URI');
  const msalTenant = config.get('MSAL_TENANT_ID');
  if (msalId && msalSecret && msalRedirect) {
    oauthClients.set('msal', new MSALOAuthClient(msalId, msalSecret, msalRedirect, msalTenant));
  } else {
    logger.warn('MSAL OAuth disabled: configuration incomplete');
  }

  return {
    container,
    logger,
    loginUseCase: new LoginUseCase(
      userRepository,
      sessionStore,
      passwordHasher,
      tokenGenerator,
      auditLogger,
      sessionTtl
    ),
    registerUserUseCase: new RegisterUserUseCase(userRepository, passwordHasher, auditLogger),
    validateSessionUseCase: new ValidateSessionUseCase(sessionStore, userRepository, tokenGenerator),
    logoutUseCase: new LogoutUseCase(sessionStore, auditLogger),
    verifyMfaUseCase: new VerifyMfaUseCase(
      userRepository,
      sessionStore,
      tokenGenerator,
      auditLogger,
      sessionTtl
    ),
    externalAuthUseCase: new ExternalAuthUseCase(
      userRepository,
      sessionStore,
      tokenGenerator,
      auditLogger,
      sessionTtl
    ),
    oauthClients,
    listThreadsUseCase: new ListThreadsUseCase(threadRepository),
    createThreadUseCase: new CreateThreadUseCase(threadRepository),
    getThreadDetailUseCase: new GetThreadDetailUseCase(threadRepository, commentRepository),
    postCommentUseCase: new PostCommentUseCase(threadRepository, commentRepository),
  };
}
