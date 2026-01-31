import { z } from 'zod';
import { IdSchema } from '@foundation/contracts';

// Basic Types
export const ThreadIdSchema = IdSchema.describe('Unique identifier for a thread');
export const CommentIdSchema = IdSchema.describe('Unique identifier for a comment');
export const UserIdSchema = IdSchema.describe('Unique identifier for a user');

export type ThreadId = z.infer<typeof ThreadIdSchema>;
export type CommentId = z.infer<typeof CommentIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;

// Thread Schema
export const ThreadSchema = z.object({
  id: ThreadIdSchema,
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().max(10000).optional(),
  authorId: UserIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Thread = z.infer<typeof ThreadSchema>;

// Comment Schema
export const CommentSchema = z.object({
  id: CommentIdSchema,
  threadId: ThreadIdSchema,
  parentId: CommentIdSchema.nullable().optional(),
  content: z.string().min(1, 'Content is required').max(5000),
  authorId: UserIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Comment = z.infer<typeof CommentSchema>;

// Nested Comment structure for Thread Detail
export type CommentNode = Comment & {
  replies: CommentNode[];
};

export const ThreadDetailSchema = ThreadSchema.extend({
  comments: z.array(z.custom<CommentNode>()),
});

export type ThreadDetail = z.infer<typeof ThreadDetailSchema>;

// Input Schemas
export const CreateThreadSchema = ThreadSchema.pick({
  title: true,
  content: true,
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;

export const PostCommentSchema = CommentSchema.pick({
  content: true,
  parentId: true,
});

export type PostCommentInput = z.infer<typeof PostCommentSchema>;
