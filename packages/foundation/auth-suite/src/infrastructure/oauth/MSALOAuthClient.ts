import type { IOAuthClient, OAuthUserInfo } from '../../application/ports.js';

export class MSALOAuthClient implements IOAuthClient {
  public readonly provider = 'msal';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string,
    private readonly tenantId: string = 'common'
  ) {}

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: 'openid profile email User.Read',
    });
    if (state) params.append('state', state);

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async authenticate(code: string): Promise<OAuthUserInfo> {
    // 1. Exchange code for token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token with Microsoft');
    }

    const { access_token } = (await tokenResponse.json()) as { access_token: string };

    // 2. Get user info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info from Microsoft Graph');
    }

    const userData = (await userResponse.json()) as {
      id: string;
      displayName: string;
      givenName: string | null;
      surname: string | null;
      mail: string | null;
      userPrincipalName: string;
    };

    return {
      id: userData.id,
      email: userData.mail || userData.userPrincipalName,
      firstName: userData.givenName || userData.displayName.split(' ')[0] || 'Microsoft',
      lastName: userData.surname || userData.displayName.split(' ').slice(1).join(' ') || 'User',
      provider: this.provider,
    };
  }
}
