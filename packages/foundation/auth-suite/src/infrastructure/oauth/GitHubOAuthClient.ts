import type { IOAuthClient, OAuthUserInfo } from '../../application/ports.js';

export class GitHubOAuthClient implements IOAuthClient {
  public readonly provider = 'github';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {}

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read:user user:email',
    });
    if (state) params.append('state', state);

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async authenticate(code: string): Promise<OAuthUserInfo> {
    // 1. Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token with GitHub');
    }

    const { access_token } = (await tokenResponse.json()) as { access_token: string };

    // 2. Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'User-Agent': 'Hono-Template-Auth',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info from GitHub');
    }

    const userData = (await userResponse.json()) as {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
    };

    // 3. Get user email if not private
    let email = userData.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'User-Agent': 'Hono-Template-Auth',
        },
      });
      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as { email: string; primary: boolean }[];
        email = emails.find((e) => e.primary)?.email || emails[0]?.email || null;
      }
    }

    const nameParts = (userData.name || userData.login).split(' ');
    const firstName = nameParts[0] || 'GitHub';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    return {
      id: userData.id.toString(),
      email,
      firstName,
      lastName,
      provider: this.provider,
    };
  }
}
