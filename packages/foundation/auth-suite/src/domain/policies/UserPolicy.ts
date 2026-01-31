import { DomainError } from '@foundation/app-core/errors.js';
import type { User } from '../contracts.js';

export class UserPolicy {
  static validateRegistrationData(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): void {
    if (!data.email || !data.email.includes('@')) {
      throw new DomainError('Valid email is required');
    }

    if (!data.password || data.password.length < 8) {
      throw new DomainError('Password must be at least 8 characters long');
    }

    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new DomainError('First name is required');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new DomainError('Last name is required');
    }

    if (data.password.includes(data.email.split('@')[0])) {
      throw new DomainError('Password cannot contain email username');
    }
  }

  static canUserLogin(user: User): void {
    if (!user.isActive) {
      throw new DomainError('User account is deactivated');
    }
  }

  static validatePasswordChange(currentPassword: string, newPassword: string): void {
    if (!newPassword || newPassword.length < 8) {
      throw new DomainError('New password must be at least 8 characters long');
    }

    if (currentPassword === newPassword) {
      throw new DomainError('New password must be different from current password');
    }
  }

  static validateEmailUpdate(newEmail: string): void {
    if (!newEmail || !newEmail.includes('@')) {
      throw new DomainError('Valid email is required');
    }
  }

  static validateNameUpdate(firstName: string, lastName: string): void {
    if (!firstName || firstName.trim().length === 0) {
      throw new DomainError('First name is required');
    }

    if (!lastName || lastName.trim().length === 0) {
      throw new DomainError('Last name is required');
    }
  }
}
