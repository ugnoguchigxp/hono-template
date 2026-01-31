import { AuthError } from '@foundation/app-core/errors.js';
import type { RequestContext } from '@foundation/app-core/types.js';
import type { ValidateSessionUseCase } from '@foundation/auth-suite/application/usecases/ValidateSessionUseCase.js';
import type { Context, Next } from 'hono';

export interface AuthMiddlewareOptions {
  optional?: boolean;
}

export function authMiddleware(
  validateSessionUseCase: ValidateSessionUseCase,
  options: AuthMiddlewareOptions = {}
) {
  return async (c: Context, next: Next) => {
    const authorization = c.req.header('authorization');
    const logger = c.get('logger');

    if (!authorization) {
      if (options.optional) {
        await next();
        return;
      }
      throw new AuthError('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    if (!token) {
      if (options.optional) {
        await next();
        return;
      }
      throw new AuthError('Bearer token required');
    }

    try {
      const result = await validateSessionUseCase.execute({ token });

      // Update request context with user info
      const currentContext = c.get('requestContext') as RequestContext;
      const updatedContext: RequestContext = {
        ...currentContext,
        actorId: result.user.getData().id,
      };

      c.set('requestContext', updatedContext);
      c.set('user', result.user);
      c.set('session', result.session);

      logger.debug('User authenticated', {
        userId: result.user.getData().id,
        sessionId: result.session.getData().id,
      });

      await next();
    } catch (error) {
      if (options.optional) {
        await next();
        return;
      }
      throw error;
    }
  };
}
