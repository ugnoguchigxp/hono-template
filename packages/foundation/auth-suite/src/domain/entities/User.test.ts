import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '@foundation/auth-suite/domain/entities/User.js';
import { UserId, Email, PasswordHash, FirstName, LastName } from '@foundation/auth-suite/domain/value-objects/index.js';

describe('User Entity', () => {
  const validUserId = UserId.create('123e4567-e89b-12d3-a456-426614174000');
  const validEmail = Email.create('test@example.com');
  const validPasswordHash = PasswordHash.create('hashed_password_123');
  const validFirstName = FirstName.create('John');
  const validLastName = LastName.create('Doe');

  describe('User Creation', () => {
    it('should create a valid user', () => {
      const user = User.create({
        id: validUserId.raw,
        email: validEmail.raw,
        passwordHash: validPasswordHash.raw,
        firstName: validFirstName.raw,
        lastName: validLastName.raw,
      });

      expect(user.getId()).toBe(validUserId.raw);
      expect(user.getEmail()).toBe(validEmail.raw);
      expect(user.getFirstName()).toBe(validFirstName.raw);
      expect(user.getLastName()).toBe(validLastName.raw);
      expect(user.isActive()).toBe(true);
    });

    it('should reconstruct user from data', () => {
      const userData = {
        id: validUserId.raw,
        email: validEmail.raw,
        passwordHash: validPasswordHash.raw,
        firstName: validFirstName.raw,
        lastName: validLastName.raw,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      const user = User.reconstruct(userData);
      expect(user.getId()).toBe(userData.id);
      expect(user.isActive()).toBe(userData.isActive);
    });
  });

  describe('User Operations', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({
        id: validUserId.raw,
        email: validEmail.raw,
        passwordHash: validPasswordHash.raw,
        firstName: validFirstName.raw,
        lastName: validLastName.raw,
      });
    });

    it('should update last login time', () => {
      const beforeUpdate = new Date();
      const updatedUser = user.updateLastLogin();
      const afterUpdate = new Date();

      expect(updatedUser.getLastLoginAt()).toBeDefined();
      expect(updatedUser.getLastLoginAt()!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(updatedUser.getLastLoginAt()!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should deactivate user', () => {
      const deactivatedUser = user.deactivate();
      expect(deactivatedUser.isActive()).toBe(false);
    });

    it('should reactivate user', () => {
      const deactivatedUser = user.deactivate();
      const reactivatedUser = deactivatedUser.activate();
      expect(reactivatedUser.isActive()).toBe(true);
    });

    it('should update user name', () => {
      const newFirstName = FirstName.create('Jane');
      const newLastName = LastName.create('Smith');
      
      const updatedUser = user.updateName(newFirstName.raw, newLastName.raw);
      
      expect(updatedUser.getFirstName()).toBe(newFirstName.raw);
      expect(updatedUser.getLastName()).toBe(newLastName.raw);
    });
  });

  describe('User Validation', () => {
    it('should validate email format', () => {
      expect(() => Email.create('invalid-email')).toThrow();
      expect(() => Email.create('test@example.com')).not.toThrow();
    });

    it('should validate name length', () => {
      expect(() => FirstName.create('')).toThrow();
      expect(() => LastName.create('')).toThrow();
      expect(() => FirstName.create('J')).not.toThrow();
      expect(() => LastName.create('D')).not.toThrow();
    });
  });
});
