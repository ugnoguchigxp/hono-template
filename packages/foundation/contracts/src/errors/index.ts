import { z } from 'zod';

export const ErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.array(ErrorDetailSchema).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});

export const ValidationErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal('VALIDATION_ERROR'),
  code: z.literal('VALIDATION_ERROR'),
});

export const NotFoundErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal('NOT_FOUND'),
  code: z.literal('NOT_FOUND'),
});

export const AuthErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal('AUTH_ERROR'),
  code: z.literal('AUTH_ERROR'),
});

export const AuthorizationErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal('AUTHORIZATION_ERROR'),
  code: z.literal('AUTHORIZATION_ERROR'),
});

export const DomainErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal('DOMAIN_ERROR'),
  code: z.literal('DOMAIN_ERROR'),
});

export const InfraErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal('INFRA_ERROR'),
  code: z.literal('INFRA_ERROR'),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
export type NotFoundErrorResponse = z.infer<typeof NotFoundErrorResponseSchema>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
export type AuthorizationErrorResponse = z.infer<typeof AuthorizationErrorResponseSchema>;
export type DomainErrorResponse = z.infer<typeof DomainErrorResponseSchema>;
export type InfraErrorResponse = z.infer<typeof InfraErrorResponseSchema>;
