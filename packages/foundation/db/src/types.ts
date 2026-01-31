import type { Transaction as BaseTransaction } from '@foundation/app-core/types.js';

export interface DBClient {
  rawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  rawQueryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  // Drizzle ORM methods
  getDrizzleDB(): any; // Using any for Drizzle compatibility
  // Drizzle query methods
  insert: any;
  update: any;
  delete: any;
  select: any;
  // Drizzle schema access
  query: any;
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
