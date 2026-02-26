import { z } from 'zod';
import { IdSchema } from '../common/index.js';

export const UserActionEventSchema = z.object({
  eventType: z.literal('UserAction'),
  actionName: z.string().min(1), // ドメインアクション名（例："postComment"）
  sourceId: IdSchema, // イベント発火源リソースID
  timestamp: z.string().datetime(),
  context: z.record(z.unknown()).optional(),
});

export const ClientErrorEventSchema = z.object({
  eventType: z.literal('ClientError'),
  message: z.string(),
  sourceId: IdSchema.optional(),
});

export const ClientEventSchema = z.discriminatedUnion('eventType', [
  UserActionEventSchema,
  ClientErrorEventSchema,
]);

export type ClientEvent = z.infer<typeof ClientEventSchema>;
export type UserActionEvent = z.infer<typeof UserActionEventSchema>;

// レスポンス用の差分更新スキーマファクトリ
// ドメインごとのリソーススキーマを渡して利用する
export const createServerDeltaSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.discriminatedUnion('deltaType', [
    z.object({ deltaType: z.literal('Upsert'), item: itemSchema }),
    z.object({ deltaType: z.literal('Delete'), id: IdSchema, kind: z.string() }),
  ]);
