import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import { ConfigService } from '../config/ConfigService'
import { createDatabase, type DatabaseHandle } from '../../infrastructure/database/client'
import { DrizzleInstanceRepository } from '../../infrastructure/database/repositories/DrizzleInstanceRepository'
import { DrizzleSessionStore } from '../../infrastructure/database/repositories/DrizzleSessionStore'
import { DrizzleUserStore } from '../../infrastructure/database/repositories/DrizzleUserStore'
import { DrizzleScannerStore } from '../../infrastructure/database/repositories/DrizzleScannerStore'
import { DrizzleMessageStore } from '../../infrastructure/database/repositories/DrizzleMessageStore'
import { DrizzleAuditLogStore } from '../../infrastructure/database/repositories/DrizzleAuditLogStore'
import { DrizzleTaskStore } from '../../infrastructure/database/repositories/DrizzleTaskStore'
import { DrizzleJobStore } from '../../infrastructure/database/repositories/DrizzleJobStore'
import { Argon2idPasswordHasher } from '../../infrastructure/auth/Argon2idPasswordHasher'
import { AuthService } from '../../application/auth/AuthService'
import { SessionService } from '../../application/auth/SessionService'
import { InstanceManager } from '../../application/instances/InstanceManager'
import { InstanceService } from '../../application/instances/InstanceService'
import type { InstanceRepository } from '../../application/instances/InstanceRepository'
import { PairingService } from '../../application/instances/PairingService'
import { LiveMessageFeed } from '../../application/messages/LiveMessageFeed'
import { MessageRecorder } from '../../application/messages/MessageRecorder'
import { ScannerService } from '../../application/scanner/ScannerService'
import { ProcessWorkerManager } from '../../infrastructure/workers/ProcessWorkerManager'
import { createApiServer } from '../../interfaces/http/ApiServer'
import { EventBus } from '../../domain/events/EventBus'
import { WorkerEventBridge } from '../../application/events/WorkerEventBridge'
import { AuditService } from '../../application/audit/AuditService'
import { TaskManager } from '../../domain/tasks/TaskManager'
import { createTaskRecorder } from '../../application/tasks/RecordingTaskManager'
import { JobScheduler } from '../../application/scheduler/JobScheduler'
import type { JobRecord } from '../../infrastructure/database/repositories/DrizzleJobStore'

export interface V3Application {
  app: Express
  config: ConfigService
  database: DatabaseHandle
  events: EventBus
  instanceRepository: InstanceRepository
  instances: InstanceService
  instanceManager: InstanceManager
  pairing: PairingService
  liveFeed: LiveMessageFeed
  messages: DrizzleMessageStore
  audit: AuditService
  auditStore: DrizzleAuditLogStore
  scanner: ScannerService
  tasks: TaskManager
  taskStore: DrizzleTaskStore
  jobs: DrizzleJobStore
  scheduler: JobScheduler
  workers: ProcessWorkerManager
  auth: AuthService
  shutdown(): Promise<void>
}

export function createV3Application(env: NodeJS.ProcessEnv = process.env): V3Application {
  const config = ConfigService.fromEnv(env)
  const database = createDatabase(config.value.DATABASE_URL, config.value.DATABASE_POOL_MAX)

  // Single domain event stream: workers bridge onto the bus, everything else subscribes.
  const events = new EventBus()
  const instanceRepository = new DrizzleInstanceRepository(database.db)
  const workers = new ProcessWorkerManager()
  void new WorkerEventBridge(events, workers)

  const instanceManager = new InstanceManager(instanceRepository, workers)
  const instances = new InstanceService(instanceRepository, instanceManager)
  const pairing = new PairingService(workers, (instanceId, request) => workers.pair(instanceId, request))
  const liveFeed = new LiveMessageFeed(events)
  const messages = new DrizzleMessageStore(database.db)
  void new MessageRecorder(messages, events)
  const scanner = new ScannerService(new DrizzleScannerStore(database.db), events)

  const auditStore = new DrizzleAuditLogStore(database.db)
  const audit = new AuditService(auditStore)

  const taskStore = new DrizzleTaskStore(database.db)
  const tasks = new TaskManager(20, createTaskRecorder(taskStore, events))

  const jobs = new DrizzleJobStore(database.db)
  const dispatchJob = async (job: JobRecord): Promise<void> => {
    if (job.type === 'send-message') {
      const payload = job.payload as { chatId?: string; text?: string }
      if (!payload.chatId || !payload.text) throw new Error('send-message job requires chatId and text')
      await workers.sendText(job.instanceId, payload.chatId, payload.text)
      return
    }
    throw new Error(`Unsupported job type: ${job.type}`)
  }
  const schedulerIntervalMs = Number(env.SCHEDULER_INTERVAL_MS ?? 30_000)
  const scheduler = new JobScheduler(jobs, tasks, events, dispatchJob, Number.isFinite(schedulerIntervalMs) && schedulerIntervalMs >= 1000 ? schedulerIntervalMs : 30_000)

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
    scanner,
    messages,
    audit,
    auditStore,
    taskStore,
    jobs,
    debug: { mockIncoming: async (instanceId, message) => { workers.mockIncoming(instanceId, message) } },
    csrfSecret: config.value.CSRF_SECRET,
    sessionCookie: { name: config.value.SESSION_COOKIE_NAME, ttlMs: config.value.SESSION_TTL_MS, secure: config.value.SESSION_SECURE, sameSite: 'lax', path: '/' },
    readiness: async () => {
      const checks: Record<string, { ok: boolean; detail?: string }> = {}
      try {
        const started = Date.now()
        await database.pool.query('SELECT 1')
        checks.database = { ok: true, detail: `${Date.now() - started}ms` }
      } catch (error) {
        checks.database = { ok: false, detail: error instanceof Error ? error.message : 'database unavailable' }
      }
      return checks
    },
  })

  return {
    app, config, database, events, instanceRepository, instances, instanceManager, pairing, liveFeed, messages, audit, auditStore, scanner, tasks, taskStore, jobs, scheduler, workers, auth,
    async shutdown() {
      await scheduler.stop()
      await instanceManager.shutdown()
      await database.close()
    },
  }
}

