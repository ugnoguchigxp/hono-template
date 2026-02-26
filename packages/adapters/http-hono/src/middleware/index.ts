// Re-export all middleware
export { createErrorHandler, createZodErrorHandler } from './errorHandler.js';
export { requestContextMiddleware } from './requestContext.js';
export { authMiddleware } from './auth.js';
export { featureFlagMiddleware } from './featureFlag.js';

export type { AuthMiddlewareOptions } from './auth.js';
