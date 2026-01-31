import { z } from 'zod';

export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  SESSION_TTL: z.coerce.number().int().positive().default(86400),
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export class Config {
  private readonly env: Environment;

  constructor(env: Record<string, string | undefined> = process.env) {
    this.env = EnvironmentSchema.parse(env);
  }

  get<K extends keyof Environment>(key: K): Environment[K] {
    return this.env[key];
  }

  get all(): Readonly<Environment> {
    return { ...this.env };
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }
}
