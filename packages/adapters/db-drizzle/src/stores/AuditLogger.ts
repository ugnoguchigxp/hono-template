import type { Logger } from '@foundation/app-core/types.js';
import type { IAuditLogger } from '@foundation/auth-suite/application/ports.js';
import type { DBClient } from '@foundation/db/types.js';
import { auditLogs } from '../schema/index.js';

export class DrizzleAuditLogger implements IAuditLogger {
  constructor(
    private readonly db: DBClient,
    private readonly logger: Logger
  ) {}

  async logUserLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        userId,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
      });

      this.logger.info('User login audit log created', {
        userId,
        action: 'LOGIN',
        ipAddress,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error as Error, {
        userId,
        action: 'LOGIN',
      });
      // Audit log failure should not break the main flow
    }
  }

  async logUserLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        userId,
        action: 'LOGOUT',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
      });

      this.logger.info('User logout audit log created', {
        userId,
        action: 'LOGOUT',
        ipAddress,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error as Error, {
        userId,
        action: 'LOGOUT',
      });
    }
  }

  async logUserRegistration(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        userId,
        action: 'REGISTRATION',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
      });

      this.logger.info('User registration audit log created', {
        userId,
        action: 'REGISTRATION',
        ipAddress,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error as Error, {
        userId,
        action: 'REGISTRATION',
      });
    }
  }

  async logPasswordChange(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        userId,
        action: 'PASSWORD_CHANGE',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
      });

      this.logger.info('Password change audit log created', {
        userId,
        action: 'PASSWORD_CHANGE',
        ipAddress,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error as Error, {
        userId,
        action: 'PASSWORD_CHANGE',
      });
    }
  }

  async logFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        action: 'FAILED_LOGIN',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        metadata: JSON.stringify({
          email,
          timestamp: new Date().toISOString(),
        }),
      });

      this.logger.warn('Failed login attempt audit log created', {
        email,
        action: 'FAILED_LOGIN',
        ipAddress,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error as Error, {
        email,
        action: 'FAILED_LOGIN',
      });
    }
  }
}
