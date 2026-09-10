import { createV3Application } from './V3Application'
import { WebSocketGateway } from '../../interfaces/websocket/WebSocketGateway'

function readCookie(request: { headers: { cookie?: string } }, name: string): string | undefined {
  const header = request.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index <= 0 || part.slice(0, index).trim() !== name) continue
    try { return decodeURIComponent(part.slice(index + 1).trim()) } catch { return undefined }
  }
  return undefined
}

async function main(): Promise<void> {
  const application = createV3Application()
  const port = application.config.value.PORT
  const server = application.app.listen(port, '0.0.0.0', () => {
    console.log(`V3 API listening on ${port}`)
  })

  const websocket = new WebSocketGateway(server, application.instanceRepository, async (request) => {
    const token = readCookie(request, application.config.value.SESSION_COOKIE_NAME)
    if (!token) return null
    const principal = await application.auth.resolve(token)
    if (!principal) return null
    return { userId: principal.userId, permissions: principal.permissions }
  })
  websocket.attachWorkerEvents(application.workers)
  websocket.attachEventBus(application.events)
  application.scheduler.start()

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`V3 shutdown requested by ${signal}`)
    const force = setTimeout(() => process.exit(1), 30_000)
    force.unref()
    server.close(async () => {
      try {
        await websocket.close()
        await application.shutdown()
        clearTimeout(force)
        process.exit(0)
      } catch (error) {
        console.error('V3 shutdown failed', error)
        process.exit(1)
      }
    })
  }

  process.once('SIGTERM', () => void shutdown('SIGTERM'))
  process.once('SIGINT', () => void shutdown('SIGINT'))
}

void main().catch((error) => {
  console.error('V3 startup failed', error)
  process.exit(1)
})
