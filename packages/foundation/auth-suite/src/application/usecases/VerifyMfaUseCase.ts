import { authenticator } from 'otplib';
import { AuthError } from '@foundation/app-core/errors.js';
import { SessionToken as SessionTokenVO } from '../../domain/entities/Session.js';
import { Session } from '../../domain/entities/Session.js';
import type { User } from '../../domain/index.js';
import { UserPolicy } from '../../domain/policies/UserPolicy.js';
import type {
  IAuditLogger,
  ISessionStore,
  ITokenGenerator,
  IUserRepository,
} from '../ports.js';

export interface VerifyMfaInput {
  userId: string;
  code: string; // TOTP code
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyMfaOutput {
  user: User;
  session: Session;
}

export class VerifyMfaUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionStore: ISessionStore,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly auditLogger: IAuditLogger,
    private readonly sessionTtlSeconds: number
  ) {}

  async execute(input: VerifyMfaInput): Promise<VerifyMfaOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AuthError('User not found');
    }

    UserPolicy.canUserLogin(user.getData());

    if (!user.isMfaRequired()) {
      throw new AuthError('MFA is not enabled for this user');
    }

    // Verify TOTP code
    const secret = user.getMfaSecret();
    if (!secret) {
      throw new AuthError('MFA secret not found');
    }

    const isValid = await this.verifyTotp(input.code, secret);
    if (!isValid) {
      throw new AuthError('Invalid MFA code');
    }

    const updatedUser = user.updateLastLogin();
    await this.userRepository.update(updatedUser);

    const token = await this.tokenGenerator.generateToken();
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000);

    const sessionToken = SessionTokenVO.create(token);
    const session = Session.create({
      id: crypto.randomUUID(),
      token: sessionToken,
      userId: user.getId(),
      expiresAt,
    });

    const savedSession = await this.sessionStore.save(session);

    await this.auditLogger.logUserLogin(user.getId(), input.ipAddress, input.userAgent);

    return {
      user: updatedUser,
      session: savedSession,
    };
  }

  // Real TOTP verification logic
  private async verifyTotp(code: string, secret: string): Promise<boolean> {
    try {
      return authenticator.check(code, secret);
    } catch (error) {
      return false;
    }
  }
}
