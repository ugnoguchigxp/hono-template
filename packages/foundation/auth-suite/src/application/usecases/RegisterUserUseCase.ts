import { DomainError } from '@foundation/app-core/errors.js';
import type { User } from '../../domain/index.js';
import { Email, User as UserEntity, type UserId } from '../../domain/index.js';
import { UserPolicy } from '../../domain/policies/UserPolicy.js';
import type { IAuditLogger, IPasswordHasher, IUserRepository } from '../ports.js';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterOutput {
  user: User;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    UserPolicy.validateRegistrationData({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const email = Email.create(input.email);
    const existingUser = await this.userRepository.findByEmail(email.raw);
    if (existingUser) {
      throw new DomainError('User with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = UserEntity.create({
      id: crypto.randomUUID() as unknown as UserId,
      email: email.raw,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const savedUser = await this.userRepository.save(user);

    await this.auditLogger.logUserRegistration(
      savedUser.getData().id,
      input.ipAddress,
      input.userAgent
    );

    return {
      user: savedUser,
    };
  }
}
