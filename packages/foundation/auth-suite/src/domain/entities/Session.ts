import type { Session as SessionType, UserId, SessionToken as SessionTokenType } from '../../contracts.js';
import { UserId as UserIdVO } from '../value-objects/index.js';

export class SessionToken {
  private readonly value: SessionTokenType;

  constructor(value: SessionTokenType) {
    this.value = value;
  }

  static create(value: SessionTokenType): SessionToken {
    return new SessionToken(value);
  }

  get raw(): SessionTokenType {
    return this.value;
  }

  equals(other: SessionToken): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class Session {
  private readonly id: string;
  private readonly token: SessionToken;
  private readonly userId: UserIdVO;
  private readonly expiresAt: Date;
  private readonly isActive: boolean;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(data: {
    id: string;
    token: SessionToken;
    userId: UserIdVO;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.token = data.token;
    this.userId = data.userId;
    this.expiresAt = data.expiresAt;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: {
    id: string;
    token: SessionToken;
    userId: UserId;
    expiresAt: Date;
  }): Session {
    return new Session({
      id: data.id,
      token: data.token,
      userId: UserIdVO.create(data.userId),
      expiresAt: data.expiresAt,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: SessionType): Session {
    return new Session({
      id: data.id,
      token: SessionToken.create(data.token),
      userId: UserIdVO.create(data.userId),
      expiresAt: data.expiresAt,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  revoke(): Session {
    return new Session({
      ...this.getDataWithVOs(),
      isActive: false,
      updatedAt: new Date(),
    });
  }

  updateExpiry(newExpiryDate: Date): Session {
    if (newExpiryDate <= this.expiresAt) {
      throw new Error('New expiry date must be later than current expiry date');
    }

    return new Session({
      ...this.getDataWithVOs(),
      expiresAt: newExpiryDate,
      updatedAt: new Date(),
    });
  }

  deactivate(): Session {
    return new Session({
      ...this.getDataWithVOs(),
      isActive: false,
      updatedAt: new Date(),
    });
  }

  getData(): SessionType {
    return {
      id: this.id,
      token: this.token.raw,
      userId: this.userId.raw,
      expiresAt: this.expiresAt,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Helper method for internal use with value objects
  private getDataWithVOs(): {
    id: string;
    token: SessionToken;
    userId: UserIdVO;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      token: this.token,
      userId: this.userId,
      expiresAt: this.expiresAt,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  get tokenValue(): SessionToken {
    return this.token;
  }

  get userIdValue(): UserIdVO {
    return this.userId;
  }
}
