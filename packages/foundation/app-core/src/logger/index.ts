import { pino } from 'pino';
import type { Logger } from '../types.js';

export class PinoLogger implements Logger {
  private readonly logger: pino.Logger;

  constructor(level = 'info') {
    this.logger = pino({
      level,
      formatters: {
        level: (label: string) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug({ ...context }, message);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info({ ...context }, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn({ ...context }, message);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        message
      );
    } else {
      this.logger.error({ ...context, error }, message);
    }
  }

  child(context: Record<string, unknown>): Logger {
    const childLogger = this.logger.child(context);
    return {
      debug: (message: string, additionalContext?: Record<string, unknown>) =>
        childLogger.debug({ ...additionalContext }, message),
      info: (message: string, additionalContext?: Record<string, unknown>) =>
        childLogger.info({ ...additionalContext }, message),
      warn: (message: string, additionalContext?: Record<string, unknown>) =>
        childLogger.warn({ ...additionalContext }, message),
      error: (
        message: string,
        error?: Error | unknown,
        additionalContext?: Record<string, unknown>
      ) => {
        if (error instanceof Error) {
          childLogger.error(
            {
              ...additionalContext,
              error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
            },
            message
          );
        } else {
          childLogger.error({ ...additionalContext, error }, message);
        }
      },
    };
  }
}

export function createLogger(level = 'info'): Logger {
  return new PinoLogger(level);
}
