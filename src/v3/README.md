# V3 Architecture Foundation

This directory contains the incremental V3 architecture. The existing bot remains the production path until each subsystem is migrated and verified.

## Dependency direction

`interfaces -> application -> domain`

Infrastructure adapters implement domain/application contracts and are not imported by domain code.

## Foundation delivered

- Typed in-process domain event bus.
- Central command registry with explicit permissions, features and dependencies.
- Bounded in-process task manager for asynchronous work.
- Explicit instance lifecycle state machine.
- WhatsApp provider abstraction so Baileys is isolated behind an adapter.
- Granular permission constants.

## End-to-end integration

The full vertical slice is wired and covered by `npm run v3:e2e`
(see `.github/workflows/v3-integration.yml`):

    Dashboard (REST + WebSocket)
      -> ApiServer -> InstanceManager -> ProcessWorkerManager (fork)
      -> worker-entry -> BaileysProvider | MockProvider -> WhatsApp
      -> worker events -> WorkerEventBridge -> EventBus
      -> MessageRecorder / ScannerService / WebSocketGateway / AuditService
      -> PostgreSQL: messages, scanner_events, audit_logs, tasks, jobs

- `EventBus` is the single domain stream; workers bridge onto it.
- Command execution runs in the worker (`!ping`, `!help`, `!uptime` built in,
  per-instance allow-list via `config.commands`); `CommandExecuted` flows back
  to the dashboard.
- `JobScheduler` polls the `jobs` table (interval schedules only in this phase)
  and executes jobs as TaskManager tasks; outcomes land on the job row and as
  `JobExecuted` events.
- Audit records are written for every mutating REST action (login, instance
  lifecycle, scanner config, job management).
- RBAC seed permissions are aligned with the actual route guards; the OWNER
  role carries the `*` wildcard at role level.

## Migration rules

1. Do not rewrite all existing commands at once.
2. New code must be instance-scoped.
3. Private messages are never persisted.
4. Runtime events are normalized before reaching application services.
5. Long-running work goes through TaskManager rather than blocking the WhatsApp event loop.
6. REST is authoritative for dashboard state; WebSocket is realtime transport only.
7. PostgreSQL will become the persistence authority after the controlled Mongo migration.
