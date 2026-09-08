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

## Migration rules

1. Do not rewrite all existing commands at once.
2. New code must be instance-scoped.
3. Private messages are never persisted.
4. Runtime events are normalized before reaching application services.
5. Long-running work goes through TaskManager rather than blocking the WhatsApp event loop.
6. REST is authoritative for dashboard state; WebSocket is realtime transport only.
7. PostgreSQL will become the persistence authority after the controlled Mongo migration.
