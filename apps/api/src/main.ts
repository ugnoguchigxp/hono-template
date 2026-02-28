import { createHonoApp } from '@adapters/http-hono';
import { DIKeys } from '@foundation/app-core/di';
import { existsSync, readFileSync } from 'node:fs';
import { bootstrapDI, resolveHonoDependencies } from './di/index.js';
import type { Config } from '@foundation/app-core/config';
import type { Logger } from '@foundation/app-core';

// Load .env from repo root when running from apps/api
const envPath = new URL('../../../.env', import.meta.url).pathname;
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

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

if (typeof Bun !== 'undefined') {
  // Bun environment
  const server = Bun.serve({
    port,
    fetch: app.fetch,
    development: config.isDevelopment,
  });

  logger.info('Server listening on port', { port: server.port });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    server.stop();
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    server.stop();
  });
} else {
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port });
  logger.info('Server listening on port', { port, runtime: 'node' });
}

export default app;
