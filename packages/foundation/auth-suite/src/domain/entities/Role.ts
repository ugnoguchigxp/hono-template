import type { Role as RoleType, RoleId as RoleIdType, Permission as PermissionType } from '../../contracts.js';

export class RoleId {
  private readonly value: RoleIdType;

  constructor(value: RoleIdType) {
    this.value = value;
  }

  static create(value: RoleIdType): RoleId {
    return new RoleId(value);
  }

  get raw(): RoleIdType {
    return this.value;
  }

  equals(other: RoleId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class Permission {
  private readonly value: PermissionType;

  constructor(value: PermissionType) {
    this.value = value;
  }

  static create(value: PermissionType): Permission {
    return new Permission(value);
  }

  get raw(): PermissionType {
    return this.value;
  }

  equals(other: Permission): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  matches(pattern: string): boolean {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(this.value);
  }
}

export class Role {
  private readonly id: RoleId;
  private readonly name: string;
  private readonly description: string | null;
  private readonly permissions: Permission[];
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(data: {
    id: RoleId;
    name: string;
    description: string | null;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.permissions = data.permissions;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: {
    id: RoleIdType;
    name: string;
    description?: string;
    permissions: PermissionType[];
  }): Role {
    return new Role({
      id: RoleId.create(data.id),
      name: data.name,
      description: data.description || null,
      permissions: data.permissions.map(p => Permission.create(p)),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: RoleType): Role {
    return new Role({
      id: RoleId.create(data.id),
      name: data.name,
      description: data.description,
      permissions: data.permissions.map((p: PermissionType) => Permission.create(p)),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions.some((p) => p.equals(permission));
  }

  hasPermissionMatching(pattern: string): boolean {
    return this.permissions.some((p) => p.matches(pattern));
  }

  updateName(name: string): Role {
    return new Role({
      ...this.getDataWithVOs(),
      name,
      updatedAt: new Date(),
    });
  }

  updateDescription(description: string | null): Role {
    return new Role({
      ...this.getDataWithVOs(),
      description,
      updatedAt: new Date(),
    });
  }

  updatePermissions(permissions: PermissionType[]): Role {
    return new Role({
      ...this.getDataWithVOs(),
      permissions: permissions.map((p: PermissionType) => Permission.create(p)),
      updatedAt: new Date(),
    });
  }

  addPermission(permission: Permission): Role {
    if (this.hasPermission(permission)) {
      return this;
    }

    return new Role({
      ...this.getDataWithVOs(),
      permissions: [...this.permissions, permission],
      updatedAt: new Date(),
    });
  }

  removePermission(permission: Permission): Role {
    const filteredPermissions = this.permissions.filter((p) => !p.equals(permission));
    if (filteredPermissions.length === this.permissions.length) {
      return this;
    }

    return new Role({
      ...this.getDataWithVOs(),
      permissions: filteredPermissions,
      updatedAt: new Date(),
    });
  }

  getData(): RoleType {
    return {
      id: this.id.raw,
      name: this.name,
      description: this.description,
      permissions: this.permissions.map(p => p.raw),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Helper method for internal use with value objects
  private getDataWithVOs(): {
    id: RoleId;
    name: string;
    description: string | null;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      permissions: this.permissions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  get idValue(): RoleId {
    return this.id;
  }

  get permissionValues(): Permission[] {
    return [...this.permissions];
  }
}
