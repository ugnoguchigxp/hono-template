import { createMiddleware } from 'hono/factory';
import type { AppEnv, FeatureFlags } from '../index.js';

export const featureFlagMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  // ヘッダーや環境変数からAI機能をフラグとして判定
  const aiEnabled =
    c.req.header('X-Feature-AI') === '1' || process.env.AI_FEATURE_ENABLED === 'true';

  c.set('featureFlags', { aiEnabled } satisfies FeatureFlags);
  await next();
});
