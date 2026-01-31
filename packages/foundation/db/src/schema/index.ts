import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Common columns
export const commonColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
};

// Users table for authentication
export const users = pgTable('users', {
  ...commonColumns,
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Nullable to support OAuth-only accounts
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'), // Encrypted TOTP secret
});

// External accounts (OAuth/SSO)
export const userExternalAccounts = pgTable('user_external_accounts', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // e.g., 'google', 'github'
  externalId: text('external_id').notNull(),
  email: text('email'),
}, (table) => ({
  providerExternalIdIdx: index('user_external_accounts_provider_external_id_idx').on(
    table.provider,
    table.externalId
  ),
  userIdIdx: index('user_external_accounts_user_id_idx').on(table.userId),
}));

// Sessions table for authentication
export const sessions = pgTable('sessions', {
  ...commonColumns,
  token: text('token').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  expiresAtIndex: index('sessions_expires_at_idx').on(table.expiresAt),
}));

// Roles table for RBAC
export const roles = pgTable('roles', {
  ...commonColumns,
  name: text('name').notNull().unique(),
  description: text('description'),
  permissions: text('permissions').array(),
});

// User roles junction table
export const userRoles = pgTable('user_roles', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
});

// Audit log table
export const auditLogs = pgTable('audit_logs', {
  ...commonColumns,
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: uuid('resource_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdIndex: index('audit_logs_user_id_idx').on(table.userId),
  actionIndex: index('audit_logs_action_idx').on(table.action),
  resourceIndex: index('audit_logs_resource_idx').on(table.resource),
  createdAtIndex: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// BBS: Threads table
export const threads = pgTable('threads', {
  ...commonColumns,
  title: text('title').notNull(),
  content: text('content'),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  authorIdIndex: index('threads_author_id_idx').on(table.authorId),
  createdAtIndex: index('threads_created_at_idx').on(table.createdAt),
}));

// BBS: Comments table
export const comments = pgTable('comments', {
  ...commonColumns,
  threadId: uuid('thread_id')
    .notNull()
    .references(() => threads.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id')
    .references((): any => comments.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  threadIdIndex: index('comments_thread_id_idx').on(table.threadId),
  parentIdIndex: index('comments_parent_id_idx').on(table.parentId),
  authorIdIndex: index('comments_author_id_idx').on(table.authorId),
  createdAtIndex: index('comments_created_at_idx').on(table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type UserExternalAccount = typeof userExternalAccounts.$inferSelect;
export type NewUserExternalAccount = typeof userExternalAccounts.$inferInsert;
