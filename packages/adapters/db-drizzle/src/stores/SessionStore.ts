import { createHash } from 'node:crypto';
import type { ISessionStore } from '@foundation/auth-suite/application/ports.js';
import { Session as SessionEntity } from '@foundation/auth-suite/domain/entities/Session.js';
import type { DBClient } from '@foundation/db/types.js';
import { and, eq, lt } from 'drizzle-orm';
import { sessions } from '../schema/index.js';

export class DrizzleSessionStore implements ISessionStore {
  constructor(private readonly db: DBClient) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async findByToken(token: string): Promise<SessionEntity | null> {
    const hashedToken = this.hashToken(token);
    const result = await this.db.query.sessions.findFirst({
      where: eq(sessions.token, hashedToken),
    });

    if (!result) {
      return null;
    }

    return SessionEntity.reconstruct({
      id: result.id,
      token: token, // We keep the raw token in the entity for the application's use
      userId: result.userId,
      expiresAt: result.expiresAt,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async save(session: SessionEntity): Promise<SessionEntity> {
    const sessionData = session.getData();
    const hashedToken = this.hashToken(sessionData.token);

    await this.db
      .insert(sessions)
      .values({
        id: sessionData.id,
        token: hashedToken,
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          token: hashedToken,
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
    const hashedToken = this.hashToken(sessionData.token);

    await this.db
      .update(sessions)
      .set({
        token: hashedToken,
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionData.id));

    return session;
  }

  async delete(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.db.delete(sessions).where(eq(sessions.token, hashedToken));
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
