import express, { type NextFunction, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { InstanceService } from '../../application/instances/InstanceService'
import type { CreateInstanceInput } from '../../application/instances/InstanceRepository'
import type { AuthService } from '../../application/auth/AuthService'
import type { SessionCookieConfig } from '../../application/auth/SessionService'
import { clearSessionCookie, readSessionCookie, setSessionCookie } from '../../application/auth/SessionCookie'
import { createAuthMiddleware, csrfProtection, getPrincipal, issueCsrfCookie, requirePermission } from './AuthMiddleware'

const createSchema = z.object({ slug: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,98}[a-z0-9]$/).max(100), name: z.string().trim().min(1).max(160), config: z.record(z.unknown()).optional() })
const updateSchema = z.object({ name: z.string().trim().min(1).max(160).optional(), config: z.record(z.unknown()).optional() }).refine((v) => v.name !== undefined || v.config !== undefined)
const idSchema = z.string().uuid()
const loginSchema = z.object({ username: z.string().trim().min(1).max(120), password: z.string().min(1).max(1024) })

class LoginRateLimiter {
  private readonly hits = new Map<string, number[]>()
  constructor(private readonly max = 5, private readonly windowMs = 60_000) {}
  allow(key: string): boolean {
    const now = Date.now()
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs)
    if (recent.length >= this.max) { this.hits.set(key, recent); return false }
    recent.push(now); this.hits.set(key, recent)
    if (this.hits.size > 10_000) this.prune(now)
    return true
  }
  private prune(now: number) { for (const [key, values] of this.hits) if (!values.some((at) => now - at < this.windowMs)) this.hits.delete(key) }
}

export interface ApiServerOptions {
  instances: InstanceService
  auth: AuthService
  sessionCookie: SessionCookieConfig
  csrfSecret: string
}

export function createApiServer(options: ApiServerOptions) {
  const app = express()
  const loginLimiter = new LoginRateLimiter()
  const authenticate = createAuthMiddleware({ auth: options.auth, cookie: options.sessionCookie })
  app.disable('x-powered-by')
  app.use(express.json({ limit: '256kb' }))
  app.use((req, res, next) => {
    const requestId = typeof req.headers['x-request-id'] === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(req.headers['x-request-id']) ? req.headers['x-request-id'] : randomUUID()
    res.setHeader('x-request-id', requestId); res.locals.requestId = requestId; next()
  })
  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
  app.get('/health/ready', (_req, res) => res.json({ status: 'ok' }))
  app.get('/health/version', (_req, res) => res.json({ version: process.env.npm_package_version ?? 'unknown' }))

  app.post('/api/v1/auth/login', async (req, res, next) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown'
      if (!loginLimiter.allow(ip)) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many login attempts', requestId: res.locals.requestId } })
      const input = loginSchema.parse(req.body)
      const result = await options.auth.login(input.username, input.password, ip, req.get('user-agent')?.slice(0, 1024))
      setSessionCookie(res, result.token, options.sessionCookie)
      issueCsrfCookie(res, options.csrfSecret, result.principal.sessionId, options.sessionCookie.secure)
      return res.json({ user: { id: result.principal.userId, username: result.principal.username, roles: [...result.principal.roles], permissions: [...result.principal.permissions] } })
    } catch (e) {
      if (e instanceof z.ZodError) return error(res, 400, 'VALIDATION_ERROR', 'Invalid login payload')
      if (e instanceof Error && e.message === 'Invalid credentials') return error(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials')
      return next(e)
    }
  })
  app.post('/api/v1/auth/logout', authenticate, csrfProtection(options.csrfSecret), async (req, res, next) => {
    try { await options.auth.logout(readSessionCookie(req, options.sessionCookie)); clearSessionCookie(res, options.sessionCookie); res.status(204).send() } catch (e) { next(e) }
  })
  app.get('/api/v1/auth/me', authenticate, (_req, res) => {
    const principal = getPrincipal(res)!
    res.json({ user: { id: principal.userId, username: principal.username, roles: [...principal.roles], permissions: [...principal.permissions] } })
  })
  app.use('/api/v1', authenticate, csrfProtection(options.csrfSecret))

  app.get('/api/v1/instances', requirePermission('instances:read'), async (req, res, next) => {
    try {
      const rawLimit = req.query.limit ? Number(req.query.limit) : undefined
      if (rawLimit !== undefined && (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100)) return error(res, 400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 100')
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
      res.json(await options.instances.list({ limit: rawLimit, cursor }))
    } catch (e) { next(e) }
  })
  app.post('/api/v1/instances', requirePermission('instances:create'), async (req, res, next) => {
    try {
      const input: CreateInstanceInput = createSchema.parse(req.body) as CreateInstanceInput
      res.status(201).json(await options.instances.create(input))
    } catch (e) { next(e) }
  })
  app.get('/api/v1/instances/:id', requirePermission('instances:read'), async (req, res, next) => { try { res.json(await options.instances.get(idSchema.parse(req.params.id))) } catch (e) { next(e) } })
  app.patch('/api/v1/instances/:id', requirePermission('instances:update'), async (req, res, next) => { try { res.json(await options.instances.update(idSchema.parse(req.params.id), updateSchema.parse(req.body))) } catch (e) { next(e) } })
  app.delete('/api/v1/instances/:id', requirePermission('instances:delete'), async (req, res, next) => { try { await options.instances.delete(idSchema.parse(req.params.id)); res.status(204).send() } catch (e) { next(e) } })

  const lifecycle = (action: (id: string) => Promise<unknown>): express.RequestHandler => async (req, res, next) => {
    try { res.status(202).json(await action(idSchema.parse(req.params.id))) } catch (e) { next(e) }
  }
  app.post('/api/v1/instances/:id/start', requirePermission('instances:start'), lifecycle(options.instances.start.bind(options.instances)))
  app.post('/api/v1/instances/:id/stop', requirePermission('instances:stop'), lifecycle(options.instances.stop.bind(options.instances)))
  app.post('/api/v1/instances/:id/restart', requirePermission('instances:restart'), lifecycle(options.instances.restart.bind(options.instances)))
  app.post('/api/v1/instances/:id/reconnect', requirePermission('instances:reconnect'), lifecycle(options.instances.reconnect.bind(options.instances)))

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return
    if (err instanceof z.ZodError) return error(res, 400, 'VALIDATION_ERROR', err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))
    if (err instanceof Error && /already exists/i.test(err.message)) return error(res, 409, 'CONFLICT', err.message)
    if (err instanceof Error && /not found/i.test(err.message)) return error(res, 404, 'NOT_FOUND', err.message)
    console.error({ requestId: res.locals.requestId, path: req.path, error: err instanceof Error ? err.message : String(err) })
    return error(res, 500, 'INTERNAL_ERROR', 'Internal server error')
  })
  return app
}

function error(res: Response, status: number, code: string, message: string) { return res.status(status).json({ error: { code, message, requestId: res.locals.requestId } }) }
