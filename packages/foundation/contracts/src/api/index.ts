import { z } from 'zod';
import { PaginationSchema } from '../common/index.js';

// Auth API schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SUCCESS'),
    token: z.string(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
    }),
    expiresAt: z.string().datetime(),
  }),
  z.object({
    type: z.literal('MFA_REQUIRED'),
    userId: z.string().uuid(),
    email: z.string().email(),
  }),
]);

export const VerifyMfaRequestSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
});

export const OAuthCallbackRequestSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const RefreshTokenRequestSchema = z.object({
  token: z.string(),
});

export const RefreshTokenResponseSchema = LoginResponseSchema;

// User management schemas
export const CreateUserRequestSchema = RegisterRequestSchema.extend({
  roles: z.array(z.string().uuid()).optional(),
});

export const UpdateUserRequestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  roles: z.array(z.string().uuid()).optional(),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable(),
});

export const UsersQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.string().uuid().optional(),
});

// Role management schemas
export const CreateRoleRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

export const UpdateRoleRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const RoleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Health check schema
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number(),
  checks: z.record(
    z.object({
      status: z.enum(['healthy', 'unhealthy']),
      message: z.string().optional(),
      responseTime: z.number().optional(),
    })
  ),
});

// Type exports
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersQuery = z.infer<typeof UsersQuerySchema>;
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;
export type RoleResponse = z.infer<typeof RoleResponseSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
