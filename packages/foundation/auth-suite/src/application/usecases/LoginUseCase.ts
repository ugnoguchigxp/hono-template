import { AuthError } from '@foundation/app-core/errors.js';
import { LoginCredentialsSchema } from '../../contracts.js';
import { SessionToken as SessionTokenVO } from '../../domain/entities/Session.js';
import type { Session, SessionToken } from '../../domain/index.js';
import { UserPolicy } from '../../domain/policies/UserPolicy.js';
import type {
  LoginUseCase as LoginUseCaseType,
  LogoutUseCase,
  RegisterUserUseCase,
  ValidateSessionUseCase,
} from '../index.js';
import type {
  IAuditLogger,
  IPasswordHasher,
  ISessionStore,
  ITokenGenerator,
  IUserRepository,
} from '../ports.js';

export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginOutput {
  user: any; // User entity
  session: any; // Session entity
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionStore: ISessionStore,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const credentials = LoginCredentialsSchema.parse({
      email: input.email,
      password: input.password,
    });

    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      await this.auditLogger.logFailedLogin(credentials.email, input.ipAddress, input.userAgent);
      throw new AuthError('Invalid credentials');
    }

    UserPolicy.canUserLogin(user.getData());

    const isValidPassword = await this.passwordHasher.verify(
      credentials.password,
      user.getData().passwordHash
    );

    if (!isValidPassword) {
      await this.auditLogger.logFailedLogin(credentials.email, input.ipAddress, input.userAgent);
      throw new AuthError('Invalid credentials');
    }

    const updatedUser = user.updateLastLogin();
    await this.userRepository.update(updatedUser);

    const token = await this.tokenGenerator.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const sessionToken = SessionTokenVO.create(token);
    const session = Session.create({
      id: crypto.randomUUID(),
      token: sessionToken,
      userId: user.getData().id,
      expiresAt,
    });

    const savedSession = await this.sessionStore.save(session);

    await this.auditLogger.logUserLogin(user.getData().id, input.ipAddress, input.userAgent);

    return {
      user: updatedUser,
      session: savedSession,
    };
  }
}
