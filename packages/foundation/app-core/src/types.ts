export interface RequestContext {
  readonly requestId: string;
  readonly actorId: string | null;
  readonly tenantId: string | null;
  readonly traceId: string;
  readonly timestamp: Date;
}

export interface RequestScope {
  readonly context: RequestContext;
  readonly logger: Logger;
  readonly transaction?: Transaction;
}

export interface Transaction {
  readonly id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;
}

export interface Container {
  register<T>(key: symbol, factory: () => T): void;
  registerSingleton<T>(key: symbol, factory: () => T): void;
  resolve<T>(key: symbol): T;
  has(key: symbol): boolean;
  createScope(): Container;
}
