# V3 database migration rollout

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Install dependencies with `npm ci`.
3. Validate the Drizzle schema with `npm run db:check`.
4. Apply committed migrations with `npm run db:migrate`.
5. Seed baseline RBAC after the application has been built.
6. Verify `/health/live` and `/health/ready` before enabling V3 workers.

Do not use `drizzle-kit push` in production. Migrations are reviewed artifacts and are applied explicitly during deployment.

The migration in this branch represents the V3 schema and should be regenerated with the exact installed Drizzle Kit version if the generated metadata differs during CI validation.
