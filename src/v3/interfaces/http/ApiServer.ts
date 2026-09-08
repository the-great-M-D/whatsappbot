import express, { type NextFunction, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { InstanceService } from '../../application/instances/InstanceService'

export interface Principal { userId: string; permissions: Set<string> }
export type PrincipalResolver = (request: Request) => Promise<Principal | null> | Principal | null

const createSchema = z.object({ slug: z.string().regex(/^[a-z0-9][a-z0-9-_-]{0,98}[a-z0-9]$/).max(100), name: z.string().trim().min(1).max(160), config: z.record(z.unknown()).optional() })
const updateSchema = z.object({ name: z.string().trim().min(1).max(160).optional(), config: z.record(z.unknown()).optional() }).refine((v) => v.name !== undefined || v.config !== undefined)
const idSchema = z.string().uuid()

export function createApiServer(options: { instances: InstanceService; principalResolver?: PrincipalResolver }) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '256kb' }))
  app.use((req, res, next) => { const requestId = typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : randomUUID(); res.setHeader('x-request-id', requestId); res.locals.requestId = requestId; next() })

  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
  app.get('/health/ready', (_req, res) => res.json({ status: 'ok' }))
  app.get('/health/version', (_req, res) => res.json({ version: process.env.npm_package_version ?? 'unknown' }))

  const authenticate: express.RequestHandler = async (req, res, next) => {
    try {
      const principal = options.principalResolver ? await options.principalResolver(req) : null
      if (!principal) return error(res, 401, 'UNAUTHENTICATED', 'Authentication required')
      res.locals.principal = principal
      next()
    } catch (e) { next(e) }
  }

  const requirePermission = (permission: string): express.RequestHandler => (req, res, next) => {
    const principal = res.locals.principal as Principal
    if (!principal.permissions.has(permission) && !principal.permissions.has('*')) return error(res, 403, 'FORBIDDEN', 'Insufficient permission')
    next()
  }

  app.use('/api/v1', authenticate)
  app.get('/api/v1/instances', requirePermission('instances:read'), async (req, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
      const result = await options.instances.list({ limit, cursor })
      res.json(result)
    } catch (e) { next(e) }
  })

  app.post('/api/v1/instances', requirePermission('instances:create'), async (req, res, next) => {
    try { const input = createSchema.parse(req.body); const instance = await options.instances.create(input); res.status(201).json(instance) } catch (e) { next(e) }
  })
  app.get('/api/v1/instances/:id', requirePermission('instances:read'), async (req, res, next) => {
    try { const id = idSchema.parse(req.params.id); res.json(await options.instances.get(id)) } catch (e) { next(e) }
  })
  app.patch('/api/v1/instances/:id', requirePermission('instances:update'), async (req, res, next) => {
    try { const id = idSchema.parse(req.params.id); res.json(await options.instances.update(id, updateSchema.parse(req.body))) } catch (e) { next(e) }
  })
  app.delete('/api/v1/instances/:id', requirePermission('instances:delete'), async (req, res, next) => {
    try { const id = idSchema.parse(req.params.id); await options.instances.delete(id); res.status(204).send() } catch (e) { next(e) }
  })

  const lifecycle = (permission: string, action: (id: string) => Promise<unknown>): express.RequestHandler => async (req, res, next) => {
    try { const id = idSchema.parse(req.params.id); const result = await action(id); res.status(202).json(result) } catch (e) { next(e) }
  }
  app.post('/api/v1/instances/:id/start', requirePermission('instances:start'), lifecycle('instances:start', options.instances.start.bind(options.instances)))
  app.post('/api/v1/instances/:id/stop', requirePermission('instances:stop'), lifecycle('instances:stop', options.instances.stop.bind(options.instances)))
  app.post('/api/v1/instances/:id/restart', requirePermission('instances:restart'), lifecycle('instances:restart', options.instances.restart.bind(options.instances)))
  app.post('/api/v1/instances/:id/reconnect', requirePermission('instances:reconnect'), lifecycle('instances:reconnect', options.instances.reconnect.bind(options.instances)))

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

function error(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message, requestId: res.locals.requestId } })
}
