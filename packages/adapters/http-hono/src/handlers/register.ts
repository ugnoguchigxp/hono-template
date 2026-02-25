import type { RegisterUserUseCase } from '@foundation/auth-suite/application/usecases/RegisterUserUseCase.js';
import { RegisterRequestSchema, UserResponseSchema } from '@foundation/contracts/api/index.js';
import type { Context } from 'hono';

export function createRegisterHandler(registerUserUseCase: RegisterUserUseCase) {
  return async (c: Context) => {
    const rawBody = await c.req.json();
    const parsed = RegisterRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json({ error: parsed.error }, 400);
    }
    const body = parsed.data;
    const logger = c.get('logger') as any;

    try {
      const input: any = {
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
      };
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
      const ua = c.req.header('user-agent');
      if (ip) input.ipAddress = ip;
      if (ua) input.userAgent = ua;
      
      const result = await registerUserUseCase.execute(input);

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
      throw error;
    }
  };
}
