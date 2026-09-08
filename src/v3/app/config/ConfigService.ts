import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  SESSION_BACKUP_KEY: z.string().min(32).optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export type AppConfig = z.infer<typeof schema>

export class ConfigService {
  private constructor(readonly value: AppConfig) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): ConfigService {
    const result = schema.safeParse(env)
    if (!result.success) {
      const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      throw new Error(`Invalid V3 configuration: ${details}`)
    }
    return new ConfigService(result.data)
  }

  get isProduction(): boolean {
    return this.value.NODE_ENV === 'production'
  }
}
