import type { IUserRepository } from '@foundation/auth-suite/application/ports.js';
import { User as UserEntity } from '@foundation/auth-suite/domain/entities/User.js';
import type { DBClient } from '@foundation/db/types.js';
import { eq } from 'drizzle-orm';
import { users } from '../schema/index.js';

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: DBClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!result) {
      return null;
    }

    return UserEntity.reconstruct({
      id: result.id,
      email: result.email,
      passwordHash: result.passwordHash,
      firstName: result.firstName,
      lastName: result.lastName,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      lastLoginAt: result.lastLoginAt,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!result) {
      return null;
    }

    return UserEntity.reconstruct({
      id: result.id,
      email: result.email,
      passwordHash: result.passwordHash,
      firstName: result.firstName,
      lastName: result.lastName,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      lastLoginAt: result.lastLoginAt,
    });
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const userData = user.getData();

    await this.db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastLoginAt: userData.lastLoginAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: userData.isActive,
          updatedAt: userData.updatedAt,
          lastLoginAt: userData.lastLoginAt,
        },
      });

    return user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });

    return !!result;
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const userData = user.getData();

    await this.db
      .update(users)
      .set({
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive,
        updatedAt: new Date(),
        lastLoginAt: userData.lastLoginAt,
      })
      .where(eq(users.id, userData.id));

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
