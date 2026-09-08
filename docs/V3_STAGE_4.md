# V3 database stage exit criteria

- Schema matches `src/v3/infrastructure/database/schema.ts`.
- Migration SQL is committed and reviewed.
- `npm run db:check` passes in CI.
- `npm run build` passes in CI.
- RBAC seed is idempotent.
- Production rollout applies migrations before V3 startup.
- V2 remains unaffected until explicit V3 cutover.

After these criteria pass, proceed to the dashboard shell and realtime operational UI.
