import type { Container } from '@foundation/app-core/types.js';
import { DIKeys } from '@foundation/app-core/di/index.js';
import { HealthCheckResponseSchema } from '@foundation/contracts/api/index.js';
import type { DBClient } from '@foundation/db/types.js';
import type { Context } from 'hono';

export function createHealthCheckHandler(version = '1.0.0') {
  return async (c: Context) => {
    const startTime = Date.now();
    const logger = c.get('logger');
    const container = c.get('container') as Container | undefined;

    // Perform health checks
    const checks: Record<string, any> = {
      database: await checkDatabase(container),
      memory: checkMemory(),
      disk: await checkDisk(),
    };

    const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');

    const response = HealthCheckResponseSchema.parse({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version,
      uptime: process.uptime(),
      checks,
    });

    const responseTime = Date.now() - startTime;
    logger.info('Health check completed', {
      status: response.status,
      responseTime,
      checks: Object.keys(checks),
    });

    return c.json(response, allHealthy ? 200 : 503);
  };
}

async function checkDatabase(container?: Container): Promise<{
  status: string;
  message?: string;
  responseTime?: number;
}> {
  try {
    if (!container || !container.has(DIKeys.DatabaseClient)) {
      return { status: 'unhealthy', message: 'Database client not available' };
    }

    const dbClient = container.resolve<DBClient>(DIKeys.DatabaseClient);
    const start = Date.now();
    await dbClient.rawQuery('SELECT 1');
    const responseTime = Date.now() - start;

    return { status: 'healthy', responseTime };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

function checkMemory(): { status: string; usage?: number } {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

  // Consider unhealthy if using more than 80% of heap
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;

  return {
    status: usagePercent > 80 ? 'unhealthy' : 'healthy',
    usage: Math.round(usagePercent),
  };
}

async function checkDisk(): Promise<{ status: string; message?: string }> {
  try {
    // Simple disk check - in a real implementation, you'd check actual disk space
    return { status: 'healthy' };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown disk error',
    };
  }
}
