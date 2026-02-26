import { IdSchema, withReferenceIntegrity } from '@foundation/contracts';
import { z } from 'zod';

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

const CommentNodeSchema: z.ZodType<CommentNode> = CommentSchema.extend({
  replies: z.array(z.lazy(() => CommentNodeSchema)),
});

export const ThreadDetailSchema = ThreadSchema.extend({
  comments: z.array(CommentNodeSchema),
});

export type ThreadDetail = z.infer<typeof ThreadDetailSchema>;

export const ThreadResourceSchema = ThreadSchema.extend({
  kind: z.literal('Thread'),
  commentIds: z.array(CommentIdSchema).default([]),
});

export type ThreadResource = z.infer<typeof ThreadResourceSchema>;

export const CommentResourceSchema = CommentSchema.extend({
  kind: z.literal('Comment'),
  replyIds: z.array(CommentIdSchema).default([]),
});

export type CommentResource = z.infer<typeof CommentResourceSchema>;

export const AnyBbsResourceSchema = z.discriminatedUnion('kind', [
  ThreadResourceSchema,
  CommentResourceSchema,
]);

export type AnyBbsResource = z.infer<typeof AnyBbsResourceSchema>;

export const ThreadListResponseSchema = z.object({
  items: z.array(AnyBbsResourceSchema),
});

export type ThreadListResponse = z.infer<typeof ThreadListResponseSchema>;

export const BulkBbsRequestSchema = z
  .object({
    items: z.array(AnyBbsResourceSchema),
  })
  .superRefine((data, ctx) => {
    withReferenceIntegrity<AnyBbsResource>((item: AnyBbsResource) => {
      if (item.kind === 'Thread') return item.commentIds;
      return item.replyIds;
    })(data.items, ctx);
  });

export type BulkBbsRequest = z.infer<typeof BulkBbsRequestSchema>;

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
