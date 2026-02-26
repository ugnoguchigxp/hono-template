import type { IOAuthClient } from '@foundation/auth-suite/application/ports.js';
import type { ExternalAuthUseCase } from '@foundation/auth-suite/application/usecases/ExternalAuthUseCase.js';
import type { LoginUseCase } from '@foundation/auth-suite/application/usecases/LoginUseCase.js';
import type { VerifyMfaUseCase } from '@foundation/auth-suite/application/usecases/VerifyMfaUseCase.js';
import {
  LoginRequestSchema,
  OAuthCallbackRequestSchema,
  VerifyMfaRequestSchema,
} from '@foundation/contracts/api/index.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { AppEnv } from '../index.js';
import { toLoginResponse } from '../mappers/index.js';

export function createLoginHandler(loginUseCase: LoginUseCase) {
  return zValidator('json', LoginRequestSchema, async (result, c: Context<AppEnv>) => {
    if (!result.success) {
      return c.json(result, 400);
    }
    const body = result.data;
    const logger = c.get('logger');

    try {
      const loginResult = await loginUseCase.execute({
        email: body.email,
        password: body.password,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
      });

      if (loginResult.type === 'MFA_REQUIRED') {
        return c.json(
          {
            type: 'MFA_REQUIRED',
            userId: loginResult.userId,
            email: loginResult.email,
          },
          200
        );
      }

      const response = toLoginResponse(loginResult.user.getData(), loginResult.session.getData());

      logger.info('User logged in successfully', {
        userId: loginResult.user.getData().id,
        sessionId: loginResult.session.getData().id,
      });

      return c.json(response, 200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Login failed', { email: body.email, error: message });
      throw error;
    }
  });
}

export function createVerifyMfaHandler(verifyMfaUseCase: VerifyMfaUseCase) {
  return zValidator('json', VerifyMfaRequestSchema, async (result, c: Context<AppEnv>) => {
    if (!result.success) {
      return c.json(result, 400);
    }
    const body = result.data;
    const logger = c.get('logger');

    try {
      const verifyResult = await verifyMfaUseCase.execute({
        userId: body.userId,
        code: body.code,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
      });

      const response = toLoginResponse(verifyResult.user.getData(), verifyResult.session.getData());

      logger.info('MFA verified successfully', {
        userId: verifyResult.user.getData().id,
        sessionId: verifyResult.session.getData().id,
      });

      return c.json(response, 200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('MFA verification failed', { userId: body.userId, error: message });
      throw error;
    }
  });
}

export function createOAuthLoginHandler(oauthClients: Map<string, IOAuthClient>) {
  return async (c: Context<AppEnv>) => {
    const provider = c.req.param('provider');
    const client = oauthClients.get(provider);
    if (!client) {
      return c.json({ error: 'Provider not supported' }, 400);
    }

    const state = crypto.randomUUID();
    setCookie(c, 'oauth_state', state, {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 3600, // 1 hour
      sameSite: 'Lax',
    });
    const authUrl = client.getAuthUrl(state);
    return c.redirect(authUrl);
  };
}

export function createOAuthCallbackHandler(
  oauthClients: Map<string, IOAuthClient>,
  externalAuthUseCase: ExternalAuthUseCase
) {
  return zValidator('query', OAuthCallbackRequestSchema, async (result, c: Context<AppEnv>) => {
    if (!result.success) {
      return c.json(result, 400);
    }
    const { code, state } = result.data;
    const provider = c.req.param('provider');
    const logger = c.get('logger');

    // Verify state
    const savedState = getCookie(c, 'oauth_state');
    if (!state || !savedState || state !== savedState) {
      logger.warn('OAuth state mismatch', { provider });
      return c.json({ error: 'Invalid state' }, 400);
    }

    const client = oauthClients.get(provider);
    if (!client) {
      return c.json({ error: 'Provider not supported' }, 400);
    }

    try {
      const userInfo = await client.authenticate(code);
      const authResult = await externalAuthUseCase.execute({
        provider: userInfo.provider,
        externalId: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        ...(userInfo.email ? { email: userInfo.email } : {}),
      });

      const response = toLoginResponse(authResult.user.getData(), authResult.session.getData());

      logger.info('OAuth login successful', {
        provider,
        userId: authResult.user.getData().id,
      });

      return c.json(response, 200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('OAuth authentication failed', { provider, error: message });
      return c.json({ error: 'Authentication failed' }, 401);
    }
  });
}
