import { AuthError } from '@foundation/app-core/errors.js';
import type { SessionToken } from '../contracts.js';
import type { IAuditLogger, ISessionStore } from '../ports.js';

export interface LogoutInput {
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export class LogoutUseCase {
  constructor(
    private readonly sessionStore: ISessionStore,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const token = SessionToken.create(input.token);

    const session = await this.sessionStore.findByToken(token);
    if (!session) {
      return; // Session already expired or doesn't exist
    }

    await this.sessionStore.delete(token);

    await this.auditLogger.logUserLogout(
      session.getData().userId,
      input.ipAddress,
      input.userAgent
    );
  }
}
