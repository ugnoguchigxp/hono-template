import { describe, it, expect } from 'vitest';
import { Config } from './index.js';

describe('Config', () => {
  const validEnv = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://localhost:5432/test',
    JWT_SECRET: 'super-secret',
  };

  it('should parse valid environment variables', () => {
    const config = new Config(validEnv);
    expect(config.get('NODE_ENV')).toBe('test');
    expect(config.get('PORT')).toBe(3000); // default value
    expect(config.isTest).toBe(true);
  });

  it('should throw error on missing required variables', () => {
    const invalidEnv = { NODE_ENV: 'test' };
    expect(() => new Config(invalidEnv)).toThrow();
  });

  it('should throw error on invalid variable types', () => {
    const invalidEnv = { 
      ...validEnv, 
      PORT: 'not-a-number' 
    };
    expect(() => new Config(invalidEnv as any)).toThrow();
  });

  it('should return all config as a readonly object', () => {
    const config = new Config(validEnv);
    const all = config.all;
    expect(all.NODE_ENV).toBe('test');
    
    // Check if it's a copy
    (all as any).NODE_ENV = 'production';
    expect(config.get('NODE_ENV')).toBe('test');
  });

  it('should correctly identify environments', () => {
    expect(new Config({ ...validEnv, NODE_ENV: 'development' }).isDevelopment).toBe(true);
    expect(new Config({ ...validEnv, NODE_ENV: 'production' }).isProduction).toBe(true);
    expect(new Config({ ...validEnv, NODE_ENV: 'test' }).isTest).toBe(true);
  });

  it('should use defaults when optional values are missing', () => {
    const minEnv = {
      DATABASE_URL: 'postgres://localhost:5432/test',
      JWT_SECRET: 'secret',
    };
    const config = new Config(minEnv);
    expect(config.get('NODE_ENV')).toBe('development');
    expect(config.get('PORT')).toBe(3000);
    expect(config.get('LOG_LEVEL')).toBe('info');
  });
});
