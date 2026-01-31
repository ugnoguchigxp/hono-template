import type {
  Email as EmailType,
  PasswordHash as PasswordHashType,
  UserId as UserIdType,
} from '../../contracts.js';

export class UserId {
  private readonly value: UserIdType;

  constructor(value: UserIdType) {
    this.value = value;
  }

  static create(value: UserIdType): UserId {
    return new UserId(value);
  }

  get raw(): UserIdType {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class Email {
  private readonly value: EmailType;

  constructor(value: EmailType) {
    this.value = value;
  }

  static create(value: EmailType): Email {
    return new Email(value);
  }

  get raw(): EmailType {
    return this.value;
  }

  get localPart(): string {
    return this.value.split('@')[0] || '';
  }

  get domain(): string {
    const parts = this.value.split('@');
    return parts[1] || '';
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class PasswordHash {
  private readonly value: PasswordHashType;

  constructor(value: PasswordHashType) {
    this.value = value;
  }

  static create(value: PasswordHashType): PasswordHash {
    return new PasswordHash(value);
  }

  get raw(): PasswordHashType {
    return this.value;
  }

  equals(other: PasswordHash): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class FirstName {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('First name cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('First name cannot exceed 100 characters');
    }
    this.value = value.trim();
  }

  static create(value: string): FirstName {
    return new FirstName(value);
  }

  get raw(): string {
    return this.value;
  }

  equals(other: FirstName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class LastName {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Last name cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('Last name cannot exceed 100 characters');
    }
    this.value = value.trim();
  }

  static create(value: string): LastName {
    return new LastName(value);
  }

  get raw(): string {
    return this.value;
  }

  equals(other: LastName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
