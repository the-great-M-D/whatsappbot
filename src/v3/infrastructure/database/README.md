# V3 database migrations

The Drizzle schema is authoritative. Migration SQL is committed under `drizzle/` and must be applied before starting V3.

## Local

```bash
npm ci
npm run db:check
npm run db:migrate
npm run build
```

`DATABASE_URL` must point at the intended PostgreSQL database. Production deployments must run migrations as an explicit deployment step; V3 startup does not perform destructive or automatic schema synchronization.

The initial migration creates the complete V3 relational schema, including users, RBAC, bot instances, WhatsApp identities/sessions, groups, commands/features, scanner events/configuration, jobs/tasks, operational logs, audit logs, and dashboard sessions.
