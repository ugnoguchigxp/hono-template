import type { Container } from '../types.js';

interface Registration<T> {
  factory: () => T;
  singleton: boolean;
  instance?: T;
}

export class DIContainer implements Container {
  private registrations = new Map<symbol, Registration<unknown>>();
  private parent: Container | undefined;

  constructor(parent?: Container) {
    this.parent = parent;
  }

  register<T>(key: symbol, factory: () => T): void {
    this.registrations.set(key, { factory, singleton: false });
  }

  registerSingleton<T>(key: symbol, factory: () => T): void {
    this.registrations.set(key, { factory, singleton: true });
  }

  resolve<T>(key: symbol): T {
    const registration = this.registrations.get(key);

    if (registration) {
      if (registration.singleton) {
        if (!registration.instance) {
          registration.instance = registration.factory();
        }
        return registration.instance as T;
      }
      return registration.factory() as T;
    }

    if (this.parent) {
      return this.parent.resolve<T>(key);
    }

    throw new Error(`No registration found for key: ${key.toString()}`);
  }

  createScope(): Container {
    return new DIContainer(this);
  }

  has(key: symbol): boolean {
    return this.registrations.has(key) || (this.parent?.has(key) ?? false);
  }

  clear(): void {
    this.registrations.clear();
  }
}

export const DIKeys = {
  Config: Symbol('Config'),
  Logger: Symbol('Logger'),
  DatabaseClient: Symbol('DatabaseClient'),
  TransactionManager: Symbol('TransactionManager'),
} as const;

export function createContainer(parent?: Container): Container {
  return new DIContainer(parent);
}
