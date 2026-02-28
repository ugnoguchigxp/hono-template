import type { Transaction, TransactionManager } from '../types.js';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class DrizzleTransactionManager implements TransactionManager {
  constructor(private db: PostgresJsDatabase<any>) {}

  async execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async withTransaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.execute(callback);
  }
}

export function createTransactionManager(
  db: PostgresJsDatabase<any>
): TransactionManager {
  return new DrizzleTransactionManager(db);
}
