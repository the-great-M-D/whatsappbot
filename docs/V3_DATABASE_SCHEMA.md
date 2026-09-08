# V3 database domains

The schema is intentionally normalized around these domains: identity/RBAC, bot instances, WhatsApp identity/session state, groups, command and feature configuration, privacy-filtered messages, scanner events/configuration, scheduled jobs, tasks, operational logs, audit logs, and dashboard sessions.

All instance-owned records carry an `instance_id` directly or through an owning relation. This supports repository-level instance scoping now and PostgreSQL row-level security later.
