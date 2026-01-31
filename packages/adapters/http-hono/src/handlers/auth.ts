import type { LoginUseCase } from '@foundation/auth-suite/application/usecases/LoginUseCase.js';
import { LoginRequestSchema, LoginResponseSchema } from '@foundation/contracts/api/index.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';

export function createLoginHandler(loginUseCase: LoginUseCase) {
  return zValidator('json', LoginRequestSchema, async (c, next) => {
    const body = c.req.valid('json');
    const logger = c.get('logger');
    const requestContext = c.get('requestContext');

    try {
      const result = await loginUseCase.execute({
        email: body.email,
        password: body.password,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
      });

      const response = LoginResponseSchema.parse({
        token: result.session.getData().token,
        user: {
          id: result.user.getData().id,
          email: result.user.getData().email,
          firstName: result.user.getData().firstName,
          lastName: result.user.getData().lastName,
        },
        expiresAt: result.session.getData().expiresAt.toISOString(),
      });

      logger.info('User logged in successfully', {
        userId: result.user.getData().id,
        sessionId: result.session.getData().id,
      });

      return c.json(response, 200);
    } catch (error) {
      await next();
      throw error;
    }
  });
}
