import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * AIによる生成結果をZodでバリデーションし、失敗した場合は
 * エラー内容をフィードバックして再生成を依頼するリトライループ
 */
export async function generateAndValidate<T>(
  schema: z.ZodType<T>,
  generateFn: (schemaHint: string) => Promise<unknown>,
  maxRetries = 3
): Promise<T> {
  const schemaHint = JSON.stringify(zodToJsonSchema(schema), null, 2);
  let lastError: z.ZodError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const promptExtension =
      attempt === 0
        ? `\n\n必ず以下のJSON Schemaに準拠したJSONを出力してください:\n${schemaHint}`
        : `\n\n必ず以下のJSON Schemaに準拠したJSONを出力してください:\n${schemaHint}\n\n前回のエラー:\n${lastError?.message}\nエラーを修正して再生成してください。`;

    const raw = await generateFn(promptExtension);
    const result = schema.safeParse(raw);
    if (result.success) {
      return result.data;
    }
    lastError = result.error;
  }

  throw new Error(`AI生成が${maxRetries}回のリトライ後も失敗しました: \n${lastError?.message}`);
}
