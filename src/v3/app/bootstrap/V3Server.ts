import { createV3Application } from './V3Application'

async function main(): Promise<void> {
  const application = createV3Application()
  const port = application.config.value.PORT
  const server = application.app.listen(port, '0.0.0.0', () => {
    console.log(`V3 API listening on ${port}`)
  })

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`V3 shutdown requested by ${signal}`)
    const force = setTimeout(() => process.exit(1), 30_000)
    force.unref()
    server.close(async () => {
      try {
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
