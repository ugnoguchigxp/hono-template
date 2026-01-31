import type { Logger } from '../types.js';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context: Record<string, unknown> | undefined;

  constructor(message: string, code: string, statusCode = 500, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

export class DomainError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DOMAIN_ERROR', 400, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 422, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, context?: Record<string, unknown>) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, id, ...context });
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
  }
}

export class InfraError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'INFRA_ERROR', 500, context);
    if (cause) {
      this.cause = cause;
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleUnknownError(error: unknown, logger: Logger): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', error);
    return new InfraError('Internal server error', error);
  }

  logger.error('Unknown error type', String(error));
  return new InfraError('Internal server error');
}
