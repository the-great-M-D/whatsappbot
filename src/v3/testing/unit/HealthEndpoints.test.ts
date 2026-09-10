import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { createApiServer, type ApiServerOptions } from '../../interfaces/http/ApiServer'

const fakeOptions = {
  // only lifecycle methods are bound eagerly during route registration;
  // everything else is touched per-request and never on these routes
  instances: { start: async () => undefined, stop: async () => undefined, restart: async () => undefined, reconnect: async () => undefined },
  auth: null, pairing: null, liveFeed: null, scanner: null,
  messages: null, audit: null, auditStore: null, taskStore: null, jobs: null,
  csrfSecret: '0123456789abcdef0123456789abcdef',
  sessionCookie: { name: 'v3_session', ttlMs: 86_400_000, secure: false, sameSite: 'lax' as const, path: '/' },
} as unknown as ApiServerOptions

async function withServer(readiness: ApiServerOptions['readiness'], run: (port: number) => Promise<void>): Promise<void> {
  const app = createApiServer({ ...fakeOptions, readiness })
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  try { await run(port) } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)) }
}

test('/health/ready reports 200 when all checks pass', async () => {
  await withServer(async () => ({ database: { ok: true, detail: '2ms' } }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health/ready`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'ok')
    assert.equal(body.checks.database, 'ok')
  })
})

test('/health/ready reports 503 when a check fails', async () => {
  await withServer(async () => ({ database: { ok: false, detail: 'connection refused' } }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health/ready`)
    assert.equal(res.status, 503)
    const body = await res.json()
    assert.equal(body.status, 'unavailable')
    assert.equal(body.checks.database, 'connection refused')
  })
})

test('/health/ready times out a hanging probe with 503', async () => {
  await withServer(() => new Promise(() => undefined), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health/ready`)
    assert.equal(res.status, 503)
    const body = await res.json()
    assert.equal(body.status, 'unavailable')
  })
})

test('/health/live stays a static liveness probe', async () => {
  await withServer(undefined, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`)
    assert.equal(res.status, 200)
    assert.equal((await res.json()).status, 'ok')
  })
})
