import { describe, it, expect, vi } from 'vitest';
import { 
  AppError, 
  DomainError, 
  NotFoundError, 
  handleUnknownError, 
  isAppError 
} from './index.js';

describe('Error Hierarchy', () => {
  it('should create an AppError with correct properties', () => {
    const error = new AppError('test message', 'TEST_CODE', 400, { foo: 'bar' });
    expect(error.message).toBe('test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(400);
    expect(error.context).toEqual({ foo: 'bar' });
    expect(error.name).toBe('AppError');
  });

  it('should detect AppError using isAppError', () => {
    const appError = new DomainError('domain error');
    const normalError = new Error('normal error');
    
    expect(isAppError(appError)).toBe(true);
    expect(isAppError(normalError)).toBe(false);
  });

  it('should format message correctly in NotFoundError', () => {
    const errWithId = new NotFoundError('User', '123');
    expect(errWithId.message).toBe('User with id 123 not found');
    
    const errWithoutId = new NotFoundError('Session');
    expect(errWithoutId.message).toBe('Session not found');
  });

  it('should handle unhandled errors by wrapping them in InfraError', () => {
    const logger = { error: vi.fn() } as any;
    const rawError = new Error('DB Connection Failed');
    
    const result = handleUnknownError(rawError, logger);
    
    expect(result.code).toBe('INFRA_ERROR');
    expect(result.statusCode).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return the same error if it is already an AppError', () => {
    const logger = { error: vi.fn() } as any;
    const domainErr = new DomainError('logic error');
    
    const result = handleUnknownError(domainErr, logger);
    
    expect(result).toBe(domainErr);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should serialize to JSON correctly', () => {
    const error = new AppError('msg', 'CODE', 500, { key: 'val' });
    const json = error.toJSON();
    
    expect(json.message).toBe('msg');
    expect(json.code).toBe('CODE');
    expect(json.context).toEqual({ key: 'val' });
    expect(json.stack).toBeDefined();
  });
});
