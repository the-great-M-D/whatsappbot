import { Router } from 'express'
import type { PairingService } from '../../application/instances/PairingService'
import type { LiveMessageFeed } from '../../application/messages/LiveMessageFeed'

export function createPairingRoutes(pairing: PairingService, feed: LiveMessageFeed): Router {
  const router = Router()
  router.get('/instances/:instanceId/pairing', (req, res) => res.json(pairing.get(req.params.instanceId)))
  router.get('/instances/:instanceId/live-feed', (req, res) => {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 1000))
    res.json({ items: feed.list(req.params.instanceId, limit) })
  })
  return router
}
