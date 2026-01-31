import { describe, it, expect } from 'vitest';
import { Session, SessionToken } from './Session.js';

describe('Session Entity', () => {
  const userId = 'user-123' as any;
  const sessionId = 'session-123';
  const token = SessionToken.create('token-123' as any);
  const now = new Date();
  const future = new Date(now.getTime() + 10000);
  const past = new Date(now.getTime() - 10000);

  it('should create a new session', () => {
    const session = Session.create({
      id: sessionId,
      token,
      userId,
      expiresAt: future,
    });

    expect(session.isValid()).toBe(true);
    expect(session.isExpired()).toBe(false);
    expect(session.getData().userId).toBe(userId);
  });

  it('should detect expired session', () => {
    const session = Session.reconstruct({
      id: sessionId,
      token: token.raw,
      userId,
      expiresAt: past,
      isActive: true,
      createdAt: past,
      updatedAt: past,
    });

    expect(session.isExpired()).toBe(true);
    expect(session.isValid()).toBe(false);
  });

  it('should detect inactive session', () => {
    const session = Session.create({
      id: sessionId,
      token,
      userId,
      expiresAt: future,
    }).deactivate();

    expect(session.isValid()).toBe(false);
  });

  it('should update expiry date', () => {
    const oldExpiry = new Date(now.getTime() + 1000);
    const newExpiry = new Date(now.getTime() + 5000);
    const session = Session.create({
      id: sessionId,
      token,
      userId,
      expiresAt: oldExpiry,
    });

    const updated = session.updateExpiry(newExpiry);
    expect(updated.getData().expiresAt).toEqual(newExpiry);
    expect(updated.getData().updatedAt.getTime()).toBeGreaterThanOrEqual(session.getData().updatedAt.getTime());
  });

  it('should throw error when updating expiry to a past date than current', () => {
    const session = Session.create({
      id: sessionId,
      token,
      userId,
      expiresAt: future,
    });

    expect(() => session.updateExpiry(past)).toThrow();
  });
});
