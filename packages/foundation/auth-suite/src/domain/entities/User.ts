import type { Email, PasswordHash, UserId, User as UserType } from '../../contracts.js';
import {
  Email as EmailVO,
  PasswordHash as PasswordHashVO,
  UserId as UserIdVO,
} from '../value-objects/index.js';

export class User {
  private readonly id: UserIdVO;
  private readonly email: EmailVO;
  private readonly passwordHash: PasswordHashVO;
  private readonly firstName: string;
  private readonly lastName: string;
  private readonly active: boolean;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;
  private readonly lastLoginAt: Date | null;

  private constructor(data: {
    id: UserIdVO;
    email: EmailVO;
    passwordHash: PasswordHashVO;
    firstName: string;
    lastName: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
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
  }

  static create(data: {
    id: UserId;
    email: Email;
    passwordHash: PasswordHash;
    firstName: string;
    lastName: string;
  }): User {
    return new User({
      id: UserIdVO.create(data.id),
      email: EmailVO.create(data.email),
      passwordHash: PasswordHashVO.create(data.passwordHash),
      firstName: data.firstName,
      lastName: data.lastName,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    });
  }

  static reconstruct(data: UserType): User {
    return new User({
      id: UserIdVO.create(data.id),
      email: EmailVO.create(data.email),
      passwordHash: PasswordHashVO.create(data.passwordHash),
      firstName: data.firstName,
      lastName: data.lastName,
      active: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastLoginAt: data.lastLoginAt,
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

  isActiveUser(): boolean {
    return this.active;
  }

  canLogin(): boolean {
    return this.active;
  }

  getData(): UserType {
    return {
      id: this.id.raw,
      email: this.email.raw,
      passwordHash: this.passwordHash.raw,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }

  // Helper method for internal use with value objects
  private getDataWithVOs(): {
    id: UserIdVO;
    email: EmailVO;
    passwordHash: PasswordHashVO;
    firstName: string;
    lastName: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
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
