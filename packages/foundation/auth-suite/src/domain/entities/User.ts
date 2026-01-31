import type { Email, PasswordHash, UserId, User as UserType } from '../../contracts.js';
import {
  Email as EmailVO,
  PasswordHash as PasswordHashVO,
  UserId as UserIdVO,
} from '../value-objects/index.js';
import { ExternalAccount } from './ExternalAccount.js';

export class User {
  private readonly id: UserIdVO;
  private readonly email: EmailVO;
  private readonly passwordHash: PasswordHashVO | null;
  private readonly firstName: string;
  private readonly lastName: string;
  private readonly active: boolean;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;
  private readonly lastLoginAt: Date | null;
  private readonly mfaEnabled: boolean;
  private readonly mfaSecret: string | null;
  private readonly externalAccounts: ExternalAccount[] = [];

  private constructor(data: {
    id: UserIdVO;
    email: EmailVO;
    passwordHash: PasswordHashVO | null;
    firstName: string;
    lastName: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    mfaEnabled: boolean;
    mfaSecret: string | null;
    externalAccounts?: ExternalAccount[];
  }) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.active = data.active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLoginAt = data.lastLoginAt;
    this.mfaEnabled = data.mfaEnabled;
    this.mfaSecret = data.mfaSecret;
    this.externalAccounts = data.externalAccounts || [];
  }

  static create(data: {
    id: UserId;
    email: Email;
    passwordHash: PasswordHash | null;
    firstName: string;
    lastName: string;
  }): User {
    return new User({
      id: UserIdVO.create(data.id),
      email: EmailVO.create(data.email),
      passwordHash: data.passwordHash ? PasswordHashVO.create(data.passwordHash) : null,
      firstName: data.firstName,
      lastName: data.lastName,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      mfaEnabled: false,
      mfaSecret: null,
    });
  }

  static reconstruct(data: UserType): User {
    return new User({
      id: UserIdVO.create(data.id),
      email: EmailVO.create(data.email),
      passwordHash: data.passwordHash ? PasswordHashVO.create(data.passwordHash) : null,
      firstName: data.firstName,
      lastName: data.lastName,
      active: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastLoginAt: data.lastLoginAt,
      mfaEnabled: data.mfaEnabled,
      mfaSecret: data.mfaSecret,
    });
  }

  updateLastLogin(): User {
    return new User({
      ...this.getDataWithVOs(),
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Public getters for testing and external access
  getId(): string {
    return this.id.raw;
  }

  getEmail(): string {
    return this.email.raw;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt;
  }

  isActive(): boolean {
    return this.active;
  }

  deactivate(): User {
    return new User({
      ...this.getDataWithVOs(),
      active: false,
      updatedAt: new Date(),
    });
  }

  activate(): User {
    return new User({
      ...this.getDataWithVOs(),
      active: true,
      updatedAt: new Date(),
    });
  }

  updateName(firstName: string, lastName: string): User {
    return new User({
      ...this.getDataWithVOs(),
      firstName,
      lastName,
      updatedAt: new Date(),
    });
  }

  enableMfa(secret: string): User {
    return new User({
      ...this.getDataWithVOs(),
      mfaEnabled: true,
      mfaSecret: secret,
      updatedAt: new Date(),
    });
  }

  disableMfa(): User {
    return new User({
      ...this.getDataWithVOs(),
      mfaEnabled: false,
      mfaSecret: null,
      updatedAt: new Date(),
    });
  }

  addExternalAccount(account: ExternalAccount): User {
    return new User({
      ...this.getDataWithVOs(),
      externalAccounts: [...this.externalAccounts, account],
      updatedAt: new Date(),
    });
  }

  isActiveUser(): boolean {
    return this.active;
  }

  canLogin(): boolean {
    return this.active;
  }

  isMfaRequired(): boolean {
    return this.mfaEnabled;
  }

  getMfaSecret(): string | null {
    return this.mfaSecret;
  }

  getExternalAccounts(): ExternalAccount[] {
    return [...this.externalAccounts];
  }

  getData(): UserType {
    return {
      id: this.id.raw,
      email: this.email.raw,
      passwordHash: this.passwordHash?.raw ?? null,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      mfaEnabled: this.mfaEnabled,
      mfaSecret: this.mfaSecret,
    };
  }

  // Helper method for internal use with value objects
  private getDataWithVOs(): {
    id: UserIdVO;
    email: EmailVO;
    passwordHash: PasswordHashVO | null;
    firstName: string;
    lastName: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    mfaEnabled: boolean;
    mfaSecret: string | null;
    externalAccounts: ExternalAccount[];
  } {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      mfaEnabled: this.mfaEnabled,
      mfaSecret: this.mfaSecret,
      externalAccounts: this.externalAccounts,
    };
  }

  get idValue(): UserIdVO {
    return this.id;
  }

  get emailValue(): EmailVO {
    return this.email;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
