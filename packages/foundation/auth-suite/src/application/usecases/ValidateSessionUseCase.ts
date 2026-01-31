import { AuthError, NotFoundError } from '@foundation/app-core/errors.js';
import type { Session, User } from '../../domain/index.js';
import { SessionToken as SessionTokenVO } from '../../domain/entities/Session.js';
import type { ISessionStore, ITokenGenerator, IUserRepository } from '../ports.js';

export interface ValidateSessionInput {
  token: string;
}

export interface ValidateSessionOutput {
  user: User;
  session: Session;
}

export class ValidateSessionUseCase {
  constructor(
    private readonly sessionStore: ISessionStore,
    private readonly userRepository: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator
  ) {}

  async execute(input: ValidateSessionInput): Promise<ValidateSessionOutput> {
    const isValidToken = await this.tokenGenerator.verifyToken(input.token);
    if (!isValidToken) {
      throw new AuthError('Invalid session token');
    }

    const token = SessionTokenVO.create(input.token);

    const session = await this.sessionStore.findByToken(token.raw);
    if (!session) {
      throw new AuthError('Invalid session token');
    }

    if (!session.isValid()) {
      if (session.isExpired()) {
        await this.sessionStore.delete(token.raw);
      }
      throw new AuthError('Session expired or invalid');
    }

    const user = await this.userRepository.findById(session.getData().userId);
    if (!user) {
      await this.sessionStore.delete(token.raw);
      throw new NotFoundError('User', session.getData().userId);
    }

    if (!user.canLogin()) {
      await this.sessionStore.delete(token.raw);
      throw new AuthError('User account is deactivated');
    }

    return {
      user,
      session,
    };
  }
}
