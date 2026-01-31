import { z } from 'zod';

export const UserIdSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PasswordHashSchema = z.string().min(60); // argon2 hash length (varies)
export const SessionTokenSchema = z.string().min(32);
export const RoleIdSchema = z.string().uuid();
export const PermissionSchema = z.string();

export const UserSchema = z.object({
  id: UserIdSchema,
  email: EmailSchema,
  passwordHash: PasswordHashSchema.nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().nullable(),
  mfaEnabled: z.boolean(),
  mfaSecret: z.string().nullable(),
});

export const ExternalAccountSchema = z.object({
  id: z.string().uuid(),
  userId: UserIdSchema,
  provider: z.string(),
  externalId: z.string(),
  email: EmailSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  token: SessionTokenSchema,
  userId: UserIdSchema,
  expiresAt: z.date(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const RoleSchema = z.object({
  id: RoleIdSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  permissions: z.array(PermissionSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LoginCredentialsSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
});

export const RegistrationDataSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type UserId = z.infer<typeof UserIdSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type PasswordHash = z.infer<typeof PasswordHashSchema>;
export type SessionToken = z.infer<typeof SessionTokenSchema>;
export type RoleId = z.infer<typeof RoleIdSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type RegistrationData = z.infer<typeof RegistrationDataSchema>;
export type ExternalAccount = z.infer<typeof ExternalAccountSchema>;
