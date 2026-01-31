import type { IAuditLogger, ISessionStore } from '../ports.js';
import { SessionToken as SessionTokenVO } from '../../domain/entities/Session.js';

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
    const token = SessionTokenVO.create(input.token);

    const session = await this.sessionStore.findByToken(token.raw);
    if (!session) {
      return; // Session already expired or doesn't exist
    }

    await this.sessionStore.delete(token.raw);

    await this.auditLogger.logUserLogout(
      session.getData().userId,
      input.ipAddress,
      input.userAgent
    );
  }
}
