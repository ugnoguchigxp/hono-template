import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { DBClient, DatabaseConfig } from './types.js';
import * as schema from './schema/index.js';

export class PostgresClient implements DBClient {
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;

  constructor(config: DatabaseConfig) {
    this.client = postgres(config.url, {
      max: config.maxConnections || 10,
      idle_timeout: config.idleTimeout || 20,
    });

    this.db = drizzle(this.client, { schema });
  }

  async rawQuery<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.client.unsafe(sql, params);
      return result as T[];
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async rawQueryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.rawQuery<T>(sql, params);
    return results.length > 0 ? results[0] ?? null : null;
  }

  async transaction<T>(
    callback: (tx: import('../types.js').Transaction) => Promise<T>
  ): Promise<T> {
    return this.db.transaction(callback);
  }

  getDrizzleDB() {
    return this.db;
  }

  // Drizzle ORM methods delegation
  get insert() {
    return this.db.insert;
  }

  get update() {
    return this.db.update;
  }

  get delete() {
    return this.db.delete;
  }

  get select() {
    return this.db.select;
  }

  // Drizzle schema access
  get query() {
    return this.db.query;
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}

export function createDBClient(config: DatabaseConfig): DBClient {
  return new PostgresClient(config);
}
