import { handleUnknownError } from '@foundation/app-core/errors.js';
import { ErrorResponseSchema } from '@foundation/contracts/errors/index.js';
import type { Context } from 'hono';
import type { ErrorHandler } from 'hono';

export function createErrorHandler(): ErrorHandler {
  return (err: Error, c: Context) => {
    const logger = c.get('logger');
    const requestContext = c.get('requestContext');

    const appError = handleUnknownError(err, logger);

    const errorResponse = ErrorResponseSchema.parse({
      error: appError.constructor.name.replace('Error', '').toUpperCase(),
      message: appError.message,
      code: appError.code,
      timestamp: new Date().toISOString(),
      requestId: requestContext?.requestId,
    });

    logger.error('HTTP request failed', appError, {
      requestId: requestContext?.requestId,
      path: c.req.path,
      method: c.req.method,
    });

    // biome-ignore lint/suspicious/noExplicitAny: Hono StatusCode type constraint
    return c.json(errorResponse, appError.statusCode as any);
  };
}

export function createZodErrorHandler(): ErrorHandler {
  return (err: Error, c: Context) => {
    if (err.name === 'ZodError') {
      const logger = c.get('logger');
      const requestContext = c.get('requestContext');

      // biome-ignore lint/suspicious/noExplicitAny: ZodError is complex to fully type here
      const zodError = err as any;
      const errorResponse = ErrorResponseSchema.parse({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        // biome-ignore lint/suspicious/noExplicitAny: ZodError is complex
        details: zodError.errors?.map((issue: any) => ({
          field: issue.path?.join('.'),
          message: issue.message,
          code: issue.code,
        })),
        timestamp: new Date().toISOString(),
        requestId: requestContext?.requestId,
      });

      logger.warn('Validation error', {
        requestId: requestContext?.requestId,
        path: c.req.path,
        method: c.req.method,
        validationErrors: zodError.errors,
      });

      return c.json(errorResponse, 422);
    }

    // Fall back to default error handler
    return createErrorHandler()(err, c);
  };
}
