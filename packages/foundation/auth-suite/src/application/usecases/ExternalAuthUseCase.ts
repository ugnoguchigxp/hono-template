import { AuthError } from '@foundation/app-core/errors.js';
import { SessionToken as SessionTokenVO } from '../../domain/entities/Session.js';
import { Session } from '../../domain/entities/Session.js';
import { User as UserEntity } from '../../domain/entities/User.js';
import { ExternalAccount } from '../../domain/entities/ExternalAccount.js';
import { UserPolicy } from '../../domain/policies/UserPolicy.js';
import type {
  IAuditLogger,
  ISessionStore,
  ITokenGenerator,
  IUserRepository,
} from '../ports.js';

export interface ExternalAuthInput {
  provider: string;
  externalId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ExternalAuthOutput {
  user: UserEntity;
  session: Session;
}

export class ExternalAuthUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionStore: ISessionStore,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly auditLogger: IAuditLogger,
    private readonly sessionTtlSeconds: number
  ) {}

  async execute(input: ExternalAuthInput): Promise<ExternalAuthOutput> {
    // 1. Check if external account already exists
    let user = await this.userRepository.findByExternalId(input.provider, input.externalId);

    // 2. If not found by external ID, try finding by email to link accounts
    if (!user && input.email) {
      user = await this.userRepository.findByEmail(input.email);
    }

    if (!user) {
      // 3. Register new user if not found at all
      user = UserEntity.create({
        id: crypto.randomUUID(),
        email: input.email ?? `external_${input.provider}_${input.externalId}@example.com`,
        passwordHash: null,
        firstName: input.firstName ?? 'External',
        lastName: input.lastName ?? 'User',
      });
      // Initial save to get the user ID persisted
      await this.userRepository.save(user);
    }

    UserPolicy.canUserLogin(user.getData());

    // 4. Link external account if not already linked
    const linkedAccounts = user.getExternalAccounts();
    const isAlreadyLinked = linkedAccounts.some(
      (acc) => acc.getData().provider === input.provider && acc.getData().externalId === input.externalId
    );

    if (!isAlreadyLinked) {
      const newAccount = ExternalAccount.create({
        userId: user.getId(),
        provider: input.provider,
        externalId: input.externalId,
        email: input.email ?? undefined,
      });
      user = user.addExternalAccount(newAccount);
      // This will now persist both the user and the new external account link
      await this.userRepository.save(user);
    }
    const finalUser = user;

    // 5. Issue session
    const updatedUser = finalUser.updateLastLogin();
    await this.userRepository.update(updatedUser);

    const token = await this.tokenGenerator.generateToken();
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000);

    const sessionToken = SessionTokenVO.create(token);
    const session = Session.create({
      id: crypto.randomUUID(),
      token: sessionToken,
      userId: updatedUser.getId(),
      expiresAt,
    });

    const savedSession = await this.sessionStore.save(session);

    await this.auditLogger.logUserLogin(updatedUser.getId(), input.ipAddress, input.userAgent);

    return {
      user: updatedUser,
      session: savedSession,
    };
  }
}
