import type { ISessionStore } from '@foundation/auth-suite/application/ports.js';
import { Session as SessionEntity } from '@foundation/auth-suite/domain/entities/Session.js';
import type { DBClient } from '@foundation/db/types.js';
import { and, eq, lt } from 'drizzle-orm';
import { sessions } from '../schema/index.js';

export class DrizzleSessionStore implements ISessionStore {
  constructor(private readonly db: DBClient) {}

  async findByToken(token: string): Promise<SessionEntity | null> {
    const result = await this.db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!result) {
      return null;
    }

    return SessionEntity.reconstruct({
      id: result.id,
      token: result.token,
      userId: result.userId,
      expiresAt: result.expiresAt,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async save(session: SessionEntity): Promise<SessionEntity> {
    const sessionData = session.getData();

    await this.db
      .insert(sessions)
      .values({
        id: sessionData.id,
        token: sessionData.token,
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          token: sessionData.token,
          userId: sessionData.userId,
          expiresAt: sessionData.expiresAt,
          isActive: sessionData.isActive,
          updatedAt: sessionData.updatedAt,
        },
      });

    return session;
  }

  async update(session: SessionEntity): Promise<SessionEntity> {
    const sessionData = session.getData();

    await this.db
      .update(sessions)
      .set({
        token: sessionData.token,
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionData.id));

    return session;
  }

  async delete(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(sessions)
      .where(and(lt(sessions.expiresAt, new Date()), eq(sessions.isActive, true)));
  }
}
