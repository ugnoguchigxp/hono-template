import { UserResponseSchema } from '@foundation/contracts/api/index.js';
import type { Context } from 'hono';

export function createMeHandler() {
  return async (c: Context) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const response = UserResponseSchema.parse({
      id: user.getData().id,
      email: user.getData().email,
      firstName: user.getData().firstName,
      lastName: user.getData().lastName,
      isActive: user.getData().isActive,
      createdAt: user.getData().createdAt.toISOString(),
      updatedAt: user.getData().updatedAt.toISOString(),
      lastLoginAt: user.getData().lastLoginAt?.toISOString() || null,
    });

    return c.json(response, 200);
  };
}
