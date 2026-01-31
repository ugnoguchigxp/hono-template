import type { RegisterUserUseCase } from '@foundation/auth-suite/application/usecases/RegisterUserUseCase.js';
import { RegisterRequestSchema, UserResponseSchema } from '@foundation/contracts/api/index.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';

export function createRegisterHandler(registerUserUseCase: RegisterUserUseCase) {
  return zValidator('json', RegisterRequestSchema, async (c, next) => {
    const body = c.req.valid('json');
    const logger = c.get('logger');

    try {
      const result = await registerUserUseCase.execute({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
      });

      const response = UserResponseSchema.parse({
        id: result.user.getData().id,
        email: result.user.getData().email,
        firstName: result.user.getData().firstName,
        lastName: result.user.getData().lastName,
        isActive: result.user.getData().isActive,
        createdAt: result.user.getData().createdAt.toISOString(),
        updatedAt: result.user.getData().updatedAt.toISOString(),
        lastLoginAt: result.user.getData().lastLoginAt?.toISOString() || null,
      });

      logger.info('User registered successfully', {
        userId: result.user.getData().id,
      });

      return c.json(response, 201);
    } catch (error) {
      await next();
      throw error;
    }
  });
}
