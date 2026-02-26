import type { Transaction, TransactionManager } from '../types.js';

export class DrizzleTransactionManager implements TransactionManager {
  constructor(
    private db: import('drizzle-orm/postgres-js').PostgresJsDatabase<
      typeof import('../schema/index.js')
    >
  ) {}

  async execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback as unknown as (tx: unknown) => Promise<T>);
  }

  async withTransaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.execute(callback);
  }
}

export function createTransactionManager(
  db: import('drizzle-orm/postgres-js').PostgresJsDatabase<typeof import('../schema/index.js')>
): TransactionManager {
  return new DrizzleTransactionManager(db);
}
