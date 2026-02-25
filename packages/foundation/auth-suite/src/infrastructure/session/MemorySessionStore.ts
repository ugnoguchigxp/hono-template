import type { ISessionStore } from '../../application/ports.js';
import type { Session } from '../../domain/index.js';

interface SessionData {
  session: Session;
  expiresAt: number;
}

export class MemorySessionStore implements ISessionStore {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(_ttlMs: number = 24 * 60 * 60 * 1000) {
    // Clean up expired sessions every hour
    this.cleanupInterval = setInterval(
      () => {
        this.deleteExpired();
      },
      60 * 60 * 1000
    );
  }

  async findByToken(token: string): Promise<Session | null> {
    const data = this.sessions.get(token);
    if (!data) {
      return null;
    }

    if (Date.now() > data.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return data.session;
  }

  async save(session: Session): Promise<Session> {
    const data: SessionData = {
      session,
      expiresAt: session.getData().expiresAt.getTime(),
    };

    this.sessions.set(session.getData().token, data);
    return session;
  }

  async update(session: Session): Promise<Session> {
    const data: SessionData = {
      session,
      expiresAt: session.getData().expiresAt.getTime(),
    };

    this.sessions.set(session.getData().token, data);
    return session;
  }

  async delete(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [token, data] of this.sessions.entries()) {
      if (data.session.getData().userId === userId) {
        this.sessions.delete(token);
      }
    }
  }

  async deleteExpired(): Promise<void> {
    const now = Date.now();
    for (const [token, data] of this.sessions.entries()) {
      if (now > data.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }

  clear(): void {
    this.sessions.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  // For testing purposes
  size(): number {
    return this.sessions.size;
  }

  hasToken(token: string): boolean {
    return this.sessions.has(token);
  }
}
