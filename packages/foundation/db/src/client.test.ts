import { describe, it, expect, vi } from 'vitest';
import { PostgresClient } from './client.js';

// Mock drizzle and postgres
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({
    transaction: vi.fn((cb) => cb('mock-tx')),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    query: {},
  })),
}));

vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    unsafe: vi.fn(),
    end: vi.fn(),
  })),
}));

describe('PostgresClient', () => {
  const config = { url: 'postgres://localhost:5432/db' };

  it('should initialize and delegate methods to drizzle', () => {
    const client = new PostgresClient(config);
    expect(client.getDrizzleDB()).toBeDefined();
    expect(client.insert).toBeDefined();
  });

  it('should execute raw queries', async () => {
    const client = new PostgresClient(config);
    const pg = (client as any).client;
    pg.unsafe.mockResolvedValue([{ id: 1 }]);

    const result = await client.rawQuery('SELECT 1');
    expect(result).toEqual([{ id: 1 }]);
    expect(pg.unsafe).toHaveBeenCalledWith('SELECT 1', []);
  });

  it('should handle transactions', async () => {
    const client = new PostgresClient(config);
    const result = await client.transaction(async (tx) => {
      return `result-${tx}`;
    });
    expect(result).toBe('result-mock-tx');
  });
});
