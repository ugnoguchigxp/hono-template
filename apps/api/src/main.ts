import {
  DrizzleAuditLogger,
  DrizzleSessionStore,
  DrizzleUserRepository,
} from '@adapters/db-drizzle/index.js';
import { createHonoApp } from '@adapters/http-hono/index.js';
import { Config } from '@foundation/app-core/config.js';
import { DIKeys, createContainer } from '@foundation/app-core/di/index.js';
import { createLogger } from '@foundation/app-core/logger.js';
import {
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  ValidateSessionUseCase,
} from '@foundation/auth-suite/application/index.js';
import {
  createPasswordHasher,
  createTokenGenerator,
} from '@foundation/auth-suite/infrastructure/index.js';
import { createDBClient } from '@foundation/db/client.js';
import { createTransactionManager } from '@foundation/db/transaction/index.js';

// Initialize configuration
const config = new Config();

// Initialize logger
const logger = createLogger(config.get('LOG_LEVEL'));
logger.info('Starting API server', {
  environment: config.get('NODE_ENV'),
  port: config.get('PORT'),
});

// Initialize DI container
const container = createContainer();

// Register singleton dependencies
container.registerSingleton(DIKeys.Config, () => config);
container.registerSingleton(DIKeys.Logger, () => logger);

// Initialize database client
const dbClient = createDBClient({
  url: config.get('DATABASE_URL'),
  maxConnections: 10,
  idleTimeout: 20,
});

container.registerSingleton(DIKeys.DatabaseClient, () => dbClient);
container.registerSingleton(DIKeys.TransactionManager, () =>
  createTransactionManager(dbClient.getDrizzleDB())
);

// Make db client available globally for health checks
(globalThis as any).dbClient = dbClient;

// Initialize auth infrastructure
const passwordHasher = createPasswordHasher();
const tokenGenerator = createTokenGenerator();

// Initialize repositories and stores
const userRepository = new DrizzleUserRepository(dbClient);
const sessionStore = new DrizzleSessionStore(dbClient);
const auditLogger = new DrizzleAuditLogger(dbClient, logger);

// Initialize auth use cases
const loginUseCase = new LoginUseCase(
  userRepository,
  sessionStore,
  passwordHasher,
  tokenGenerator,
  auditLogger
);

const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, auditLogger);

const validateSessionUseCase = new ValidateSessionUseCase(
  sessionStore,
  userRepository,
  auditLogger
);

const logoutUseCase = new LogoutUseCase(sessionStore, auditLogger);

// Create Hono app
const app = createHonoApp({
  container,
  logger,
  loginUseCase,
  registerUserUseCase,
  validateSessionUseCase,
  logoutUseCase,
});

// Start server
const port = config.get('PORT');

logger.info('API server started', { port });

// Bun environment
const server = Bun.serve({
  port,
  fetch: app.fetch,
  development: config.isDevelopment,
});

logger.info('Server listening on port', { port: server.port });

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  server.stop();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  server.stop();
});

export default app;
