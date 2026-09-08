import { Router } from 'express'
import { z } from 'zod'
import type { PairingService } from '../../application/instances/PairingService'
import type { LiveMessageFeed } from '../../application/messages/LiveMessageFeed'

const pairSchema = z.object({ method: z.enum(['qr', 'phone']), phoneNumber: z.string().trim().min(7).max(32).optional() }).superRefine((value, ctx) => {
  if (value.method === 'phone' && !value.phoneNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phoneNumber'], message: 'phoneNumber is required for phone pairing' })
})

type PermissionMiddleware = (...args: any[]) => any

export function createPairingRoutes(pairing: PairingService, feed: LiveMessageFeed, requirePairPermission?: PermissionMiddleware): Router {
  const router = Router()
  router.get('/instances/:instanceId/pairing', (req, res) => res.json(pairing.get(req.params.instanceId)))
  router.post('/instances/:instanceId/pairing', requirePairPermission ?? ((_req: any, _res: any, next: any) => next()), async (req, res, next) => {
    try {
      const input = pairSchema.parse(req.body)
      await pairing.pair(req.params.instanceId, input)
      res.status(202).json({ accepted: true, instanceId: req.params.instanceId, method: input.method })
    } catch (error) { next(error) }
  })
  router.get('/instances/:instanceId/live-feed', (req, res) => {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 1000))
    res.json({ items: feed.list(req.params.instanceId, limit) })
  })
  return router
}
