import { z } from 'zod';

/**
 * フラットなリソース配列内で ID の一意性と参照整合性を検証する superRefine ヘルパー
 */
export function withReferenceIntegrity<T extends { id: string }>(getRefIds: (item: T) => string[]) {
  return (items: T[], ctx: z.RefinementCtx) => {
    const allIds = new Set(items.map((i) => i.id));
    const seen = new Set<string>();

    let idx = 0;
    for (const item of items) {
      // ID 一意性
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `重複ID: ${item.id}`,
          path: [idx, 'id'],
        });
      }
      seen.add(item.id);

      // 参照整合性
      for (const refId of getRefIds(item)) {
        if (!allIds.has(refId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `参照先ID不在: ${refId}`,
            path: [idx],
          });
        }
      }
      idx++;
    }
  };
}
