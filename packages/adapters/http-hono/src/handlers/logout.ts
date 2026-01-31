import type { LogoutUseCase } from '@foundation/auth-suite/application/usecases/LogoutUseCase.js';
import type { Context } from 'hono';

export function createLogoutHandler(logoutUseCase: LogoutUseCase) {
  return async (c: Context) => {
    const session = c.get('session');
    const logger = c.get('logger');

    if (!session) {
      return c.json({ message: 'No active session' }, 200);
    }

    await logoutUseCase.execute({
      token: session.getData().token,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    logger.info('User logged out successfully', {
      userId: session.getData().userId,
      sessionId: session.getData().id,
    });

    return c.json({ message: 'Logged out successfully' }, 200);
  };
}
