# Migration safety policy

- PostgreSQL is the V3 source of truth.
- Drizzle schema changes require reviewed, committed migration SQL.
- Production must never use automatic schema synchronization.
- Destructive migrations require an explicit review and backup/restore plan.
- Migration execution happens before V3 application startup.
- RBAC seed data is idempotent and separate from schema migration.
