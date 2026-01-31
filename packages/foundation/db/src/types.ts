import type { Transaction as BaseTransaction } from '@foundation/app-core/types.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema/index.js';

export type DrizzleDatabase = PostgresJsDatabase<typeof schema>;

export interface DBClient {
  rawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  rawQueryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  // Drizzle ORM methods
  getDrizzleDB(): DrizzleDatabase;
  // Drizzle query methods
  insert: DrizzleDatabase['insert'];
  update: DrizzleDatabase['update'];
  delete: DrizzleDatabase['delete'];
  select: DrizzleDatabase['select'];
  // Drizzle schema access
  query: DrizzleDatabase['query'];
}

export interface Transaction extends BaseTransaction {
  rawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  rawQueryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
}

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  idleTimeout?: number;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface TransactionManager {
  execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  withTransaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}
