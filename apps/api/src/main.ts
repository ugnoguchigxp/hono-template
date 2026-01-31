import { createHonoApp } from '@adapters/http-hono/index.js';
import { DIKeys } from '@foundation/app-core/di/index.js';
import { bootstrapDI, resolveHonoDependencies } from './di/index.js';
import type { Config } from '@foundation/app-core/config.js';
import type { Logger } from '@foundation/app-core/types.js';

// Initialize DI and resolve dependencies
const container = bootstrapDI();
const deps = resolveHonoDependencies(container);
const config = container.resolve<Config>(DIKeys.Config);
const logger = container.resolve<Logger>(DIKeys.Logger);

logger.info('Starting API server', {
  environment: config.get('NODE_ENV'),
  port: config.get('PORT'),
});

// Create Hono app
const app = createHonoApp(deps);

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
