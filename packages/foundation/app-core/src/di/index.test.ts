import { describe, it, expect } from 'vitest';
import { DIContainer } from './index.js';

describe('DIContainer', () => {
  it('should register and resolve a transient dependency', () => {
    const container = new DIContainer();
    const Key = Symbol('Test');
    let count = 0;
    
    container.register(Key, () => {
      count++;
      return { count };
    });

    const instance1 = container.resolve<{ count: number }>(Key);
    const instance2 = container.resolve<{ count: number }>(Key);

    expect(instance1.count).toBe(1);
    expect(instance2.count).toBe(2);
    expect(instance1).not.toBe(instance2);
  });

  it('should register and resolve a singleton dependency', () => {
    const container = new DIContainer();
    const Key = Symbol('Singleton');
    let count = 0;

    container.registerSingleton(Key, () => {
      count++;
      return { count };
    });

    const instance1 = container.resolve<{ count: number }>(Key);
    const instance2 = container.resolve<{ count: number }>(Key);

    expect(instance1.count).toBe(1);
    expect(instance2.count).toBe(1);
    expect(instance1).toBe(instance2);
  });

  it('should resolve from parent container', () => {
    const parent = new DIContainer();
    const child = parent.createScope();
    const Key = Symbol('ParentKey');

    parent.registerSingleton(Key, () => 'parent-value');

    expect(child.resolve(Key)).toBe('parent-value');
  });

  it('should override parent registration in child scope', () => {
    const parent = new DIContainer();
    const Key = Symbol('Key');
    parent.register(Key, () => 'parent');

    const child = parent.createScope();
    child.register(Key, () => 'child');

    expect(child.resolve(Key)).toBe('child');
    expect(parent.resolve(Key)).toBe('parent');
  });

  it('should throw error when resolving unregistered key', () => {
    const container = new DIContainer();
    expect(() => container.resolve(Symbol('None'))).toThrow('No registration found');
  });

  it('should clear all registrations', () => {
    const container = new DIContainer();
    const Key = Symbol('Key');
    container.register(Key, () => 'val');
    expect(container.has(Key)).toBe(true);
    
    container.clear();
    expect(container.has(Key)).toBe(false);
  });
});
