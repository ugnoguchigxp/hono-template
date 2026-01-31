import type { Transaction, TransactionManager } from '../types.js';

export class DrizzleTransactionManager implements TransactionManager {
  constructor(private db: import('drizzle-orm').PostgresJsDatabase) {}

  async execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async withTransaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.execute(callback);
  }
}

export function createTransactionManager(
  db: import('drizzle-orm').PostgresJsDatabase
): TransactionManager {
  return new DrizzleTransactionManager(db);
}
