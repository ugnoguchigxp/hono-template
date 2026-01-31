import type { Email, Role, RoleId, Session, SessionToken, User, UserId } from '../contracts.js';
import type {
  Role as RoleEntity,
  Session as SessionEntity,
  User as UserEntity,
} from '../domain/index.js';

export interface IUserRepository {
  findById(id: UserId): Promise<UserEntity | null>;
  findByEmail(email: Email): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  existsByEmail(email: Email): Promise<boolean>;
  update(user: UserEntity): Promise<UserEntity>;
  delete(id: UserId): Promise<void>;
}

export interface ISessionStore {
  findByToken(token: SessionToken): Promise<SessionEntity | null>;
  save(session: SessionEntity): Promise<SessionEntity>;
  update(session: SessionEntity): Promise<SessionEntity>;
  delete(token: SessionToken): Promise<void>;
  deleteByUserId(userId: UserId): Promise<void>;
  deleteExpired(): Promise<void>;
}

export interface IRoleRepository {
  findById(id: RoleId): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  save(role: RoleEntity): Promise<RoleEntity>;
  update(role: RoleEntity): Promise<RoleEntity>;
  delete(id: RoleId): Promise<void>;
  findAll(): Promise<RoleEntity[]>;
}

export interface IUserRoleRepository {
  findByUserId(userId: UserId): Promise<RoleEntity[]>;
  addRoleToUser(userId: UserId, roleId: RoleId): Promise<void>;
  removeRoleFromUser(userId: UserId, roleId: RoleId): Promise<void>;
  removeAllRolesFromUser(userId: UserId): Promise<void>;
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface ITokenGenerator {
  generateToken(): Promise<string>;
  verifyToken(token: string): Promise<boolean>;
}

export interface IAuditLogger {
  logUserLogin(userId: UserId, ipAddress?: string, userAgent?: string): Promise<void>;
  logUserLogout(userId: UserId, ipAddress?: string, userAgent?: string): Promise<void>;
  logUserRegistration(userId: UserId, ipAddress?: string, userAgent?: string): Promise<void>;
  logPasswordChange(userId: UserId, ipAddress?: string, userAgent?: string): Promise<void>;
  logFailedLogin(email: Email, ipAddress?: string, userAgent?: string): Promise<void>;
}
