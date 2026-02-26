import type { Session, User } from '@foundation/auth-suite/contracts.js';
import type { LoginResponse, UserResponse } from '@foundation/contracts/api/index.js';

/** ドメインエンティティ → HTTP レスポンス DTO への変換（ログイン時） */
export function toLoginResponse(user: User, session: Session): LoginResponse {
  return {
    type: 'SUCCESS',
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    expiresAt: session.expiresAt.toISOString(),
  };
}

/** ドメインエンティティ → HTTP レスポンス DTO への変換（ユーザー単体） */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
  };
}
