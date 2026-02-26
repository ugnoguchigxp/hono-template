import { z } from 'zod';
import { IdSchema } from '../common/index.js';

export const ServerUpsertDeltaSchema = z.object({
  deltaType: z.literal('Upsert'),
  item: z.record(z.unknown()),
});

export const ServerDeleteDeltaSchema = z.object({
  deltaType: z.literal('Delete'),
  id: IdSchema,
  kind: z.string().min(1),
});

export const ServerDeltaSchema = z.discriminatedUnion('deltaType', [
  ServerUpsertDeltaSchema,
  ServerDeleteDeltaSchema,
]);

export type ServerDelta = z.infer<typeof ServerDeltaSchema>;
