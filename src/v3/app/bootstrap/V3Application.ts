import type { Express } from 'express'
import { ConfigService } from '../config/ConfigService'
import { createDatabase, type DatabaseHandle } from '../../infrastructure/database/client'
import { DrizzleInstanceRepository } from '../../infrastructure/database/repositories/DrizzleInstanceRepository'
import { DrizzleSessionStore } from '../../infrastructure/database/repositories/DrizzleSessionStore'
import { DrizzleUserStore } from '../../infrastructure/database/repositories/DrizzleUserStore'
import { Argon2idPasswordHasher } from '../../infrastructure/auth/Argon2idPasswordHasher'
import { AuthService } from '../../application/auth/AuthService'
import { SessionService } from '../../application/auth/SessionService'
import { InstanceManager } from '../../application/instances/InstanceManager'
import { InstanceService } from '../../application/instances/InstanceService'
import type { InstanceRepository } from '../../application/instances/InstanceRepository'
import { PairingService } from '../../application/instances/PairingService'
import { LiveMessageFeed } from '../../application/messages/LiveMessageFeed'
import { ProcessWorkerManager } from '../../infrastructure/workers/ProcessWorkerManager'
import { createApiServer } from '../../interfaces/http/ApiServer'

export interface V3Application {
  app: Express
  config: ConfigService
  database: DatabaseHandle
  instanceRepository: InstanceRepository
  instances: InstanceService
  instanceManager: InstanceManager
  pairing: PairingService
  liveFeed: LiveMessageFeed
  workers: ProcessWorkerManager
  auth: AuthService
  shutdown(): Promise<void>
}

export function createV3Application(env: NodeJS.ProcessEnv = process.env): V3Application {
  const config = ConfigService.fromEnv(env)
  const database = createDatabase(config.value.DATABASE_URL, config.value.DATABASE_POOL_MAX)
  const instanceRepository = new DrizzleInstanceRepository(database.db)
  const workers = new ProcessWorkerManager()
  const instanceManager = new InstanceManager(instanceRepository, workers)
  const instances = new InstanceService(instanceRepository, instanceManager)
  const pairing = new PairingService(workers, (instanceId, request) => workers.pair(instanceId, request))
  const liveFeed = new LiveMessageFeed(workers)
  const users = new DrizzleUserStore(database.db)
  const sessions = new SessionService(new DrizzleSessionStore(database.db), {
    name: config.value.SESSION_COOKIE_NAME,
    ttlMs: config.value.SESSION_TTL_MS,
    secure: config.value.SESSION_SECURE,
    sameSite: 'lax',
    path: '/',
  })
  const auth = new AuthService(users, new Argon2idPasswordHasher(), sessions)
  const app = createApiServer({
    instances,
    auth,
    pairing,
    liveFeed,
    sessionCookie: { name: config.value.SESSION_COOKIE_NAME, ttlMs: config.value.SESSION_TTL_MS, secure: config.value.SESSION_SECURE, sameSite: 'lax', path: '/' },
    csrfSecret: config.value.CSRF_SECRET,
  })

  return {
    app,
    config,
    database,
    instanceRepository,
    instances,
    instanceManager,
    pairing,
    liveFeed,
    workers,
    auth,
    async shutdown() {
      await instanceManager.shutdown()
      await database.close()
    },
  }
}
