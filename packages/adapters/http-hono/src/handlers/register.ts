import type { RegisterUserUseCase } from '@foundation/auth-suite/application/usecases/RegisterUserUseCase.js';
import { RegisterRequestSchema } from '@foundation/contracts/api/index.js';
import type { Context } from 'hono';
import { toUserResponse } from '../mappers/index.js';

export function createRegisterHandler(registerUserUseCase: RegisterUserUseCase) {
  return async (c: Context) => {
    const rawBody = await c.req.json();
    const parsed = RegisterRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json({ error: parsed.error }, 400);
    }
    const body = parsed.data;
    const logger = c.get('logger');

    const input = {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    } as Parameters<RegisterUserUseCase['execute']>[0];
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    const ua = c.req.header('user-agent');
    if (ip) input.ipAddress = ip;
    if (ua) input.userAgent = ua;

    const result = await registerUserUseCase.execute(input);
    const response = toUserResponse(result.user.getData());

    logger.info('User registered successfully', {
      userId: result.user.getData().id,
    });

    return c.json(response, 201);
  };
}
