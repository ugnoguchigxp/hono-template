// Re-export all types and classes
export type {
  DBClient,
  Transaction,
  DatabaseConfig,
  QueryResult,
  TransactionManager,
} from './types.js';

export { PostgresClient, createDBClient } from './client.js';

export * from './schema/index.js';

export { DrizzleTransactionManager, createTransactionManager } from './transaction/index.js';
