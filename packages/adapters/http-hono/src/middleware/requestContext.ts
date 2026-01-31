import { createRequestContext } from '@foundation/app-core/context.js';
import type { RequestContext } from '@foundation/app-core/types.js';
import type { Context, Next } from 'hono';

export function requestContextMiddleware() {
  return async (c: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    const traceId = c.req.header('x-trace-id') || requestId;

    const requestContext: RequestContext = createRequestContext(
      requestId,
      traceId,
      null, // Will be set by auth middleware
      null, // Will be set by tenant middleware
      new Date()
    );

    c.set('requestContext', requestContext);

    // Create logger child with request context
    const logger = c.get('logger');
    const requestLogger = logger.child({
      requestId,
      traceId,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    });

    c.set('logger', requestLogger);

    requestLogger.info('Request started');

    const start = Date.now();
    await next();
    const duration = Date.now() - start;

    requestLogger.info('Request completed', {
      statusCode: c.res.status,
      duration,
    });
  };
}
