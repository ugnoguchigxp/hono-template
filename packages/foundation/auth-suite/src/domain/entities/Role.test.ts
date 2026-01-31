import { describe, it, expect } from 'vitest';
import { Role, Permission } from './Role.js';

describe('Role Entity', () => {
  const roleId = 'admin' as any;
  const permissions = ['user:read', 'user:write'] as any[];

  it('should create a new role', () => {
    const role = Role.create({
      id: roleId,
      name: 'Administrator',
      permissions,
    });

    expect(role.getData().name).toBe('Administrator');
    expect(role.hasPermission(Permission.create('user:read' as any))).toBe(true);
    expect(role.hasPermission(Permission.create('order:read' as any))).toBe(false);
  });

  it('should support permission matching with wildcards', () => {
    const role = Role.create({
      id: roleId,
      name: 'Editor',
      permissions: ['article:*'] as any[],
    });

    expect(role.hasPermissionMatching('article:read')).toBe(true);
    expect(role.hasPermissionMatching('article:delete')).toBe(true);
    expect(role.hasPermissionMatching('user:read')).toBe(false);
  });

  it('should add and remove permissions', () => {
    let role = Role.create({
      id: roleId,
      name: 'User',
      permissions: ['profile:read'] as any[],
    });

    role = role.addPermission(Permission.create('profile:write' as any));
    expect(role.getData().permissions).toContain('profile:write');

    role = role.removePermission(Permission.create('profile:read' as any));
    expect(role.getData().permissions).not.toContain('profile:read');
    expect(role.getData().permissions).toHaveLength(1);
  });

  it('should correctly reconstruct from data', () => {
    const now = new Date();
    const role = Role.reconstruct({
      id: roleId,
      name: 'Custom',
      description: 'Desc',
      permissions: ['p1'] as any[],
      createdAt: now,
      updatedAt: now,
    });

    expect(role.idValue.raw).toBe(roleId);
    expect(role.permissionValues[0]?.raw).toBe('p1' as any);
  });
});
