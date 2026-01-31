import type { IOAuthClient, OAuthUserInfo } from '../../application/ports.js';

export class GoogleOAuthClient implements IOAuthClient {
  public readonly provider = 'google';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {}

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    if (state) params.append('state', state);

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async authenticate(code: string): Promise<OAuthUserInfo> {
    // 1. Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token with Google');
    }

    const { access_token } = (await tokenResponse.json()) as { access_token: string };

    // 2. Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const userData = (await userResponse.json()) as {
      sub: string;
      email: string;
      given_name: string;
      family_name: string;
    };

    return {
      id: userData.sub,
      email: userData.email,
      firstName: userData.given_name,
      lastName: userData.family_name,
      provider: this.provider,
    };
  }
}
