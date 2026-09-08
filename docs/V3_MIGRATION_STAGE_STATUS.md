# V3 migration stage status

This branch adds the reviewed V3 PostgreSQL schema migration, RBAC seed implementation, migration safety documentation, and CI validation for TypeScript/build plus Drizzle checks.

CI is authoritative for validating the migration metadata against the pinned Drizzle Kit version. Do not merge if `db:check` or `build` fails.
