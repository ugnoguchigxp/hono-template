import { beforeEach, describe, expect, it } from 'vitest';
import { DIContainer, DIKeys, createContainer } from '../src/di/index.js';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  it('should register and resolve dependencies', () => {
    const factory = () => ({ name: 'test' });
    const key = Symbol('Test');

    container.register(key, factory);
    const instance = container.resolve(key);

    expect(instance).toEqual({ name: 'test' });
  });

  it('should handle singleton dependencies', () => {
    let callCount = 0;
    const factory = () => {
      callCount++;
      return { count: callCount };
    };
    const key = Symbol('SingletonTest');

    container.registerSingleton(key, factory);

    const instance1 = container.resolve(key);
    const instance2 = container.resolve(key);

    expect(instance1).toBe(instance2);
    expect(callCount).toBe(1);
    expect(instance1.count).toBe(1);
  });

  it('should create new instances for non-singleton dependencies', () => {
    let callCount = 0;
    const factory = () => {
      callCount++;
      return { count: callCount };
    };
    const key = Symbol('NonSingletonTest');

    container.register(key, factory);

    const instance1 = container.resolve(key);
    const instance2 = container.resolve(key);

    expect(instance1).not.toBe(instance2);
    expect(callCount).toBe(2);
    expect(instance1.count).toBe(1);
    expect(instance2.count).toBe(2);
  });

  it('should create scoped containers', () => {
    const parent = new DIContainer();
    const key = Symbol('ScopedTest');
    const factory = () => ({ value: 'scoped' });

    parent.register(key, factory);
    const scoped = parent.createScope();

    const instance = scoped.resolve(key);
    expect(instance).toEqual({ value: 'scoped' });
  });

  it('should throw error for unregistered dependencies', () => {
    const key = Symbol('Unregistered');

    expect(() => container.resolve(key)).toThrow('No registration found');
  });

  it('should check if key is registered', () => {
    const key = Symbol('Test');

    expect(container.has(key)).toBe(false);

    container.register(key, () => ({}));
    expect(container.has(key)).toBe(true);
  });
});
