import { beforeEach, describe, expect, it } from 'vitest';
import { Config } from '../src/config/index.js';

describe('Config', () => {
  let config: Config;

  beforeEach(() => {
    config = new Config({
      NODE_ENV: 'test',
      PORT: '3001',
      LOG_LEVEL: 'debug',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    });
  });

  it('should parse environment variables correctly', () => {
    expect(config.get('NODE_ENV')).toBe('test');
    expect(config.get('PORT')).toBe(3001);
    expect(config.get('LOG_LEVEL')).toBe('debug');
    expect(config.get('DATABASE_URL')).toBe('postgresql://test:test@localhost:5432/test');
  });

  it('should provide readonly access to all env vars', () => {
    const all = config.all;
    expect(all.NODE_ENV).toBe('test');
    expect(all.PORT).toBe(3001);
  });

  it('should correctly identify environment', () => {
    expect(config.isTest).toBe(true);
    expect(config.isDevelopment).toBe(false);
    expect(config.isProduction).toBe(false);
  });

  it('should use defaults when values are missing', () => {
    const defaultConfig = new Config({
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    });

    expect(defaultConfig.get('NODE_ENV')).toBe('development');
    expect(defaultConfig.get('PORT')).toBe(3000);
    expect(defaultConfig.get('LOG_LEVEL')).toBe('info');
  });
});
