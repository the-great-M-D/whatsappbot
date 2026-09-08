## Operator notes

Run migrations from the same release artifact that will run V3. Confirm `DATABASE_URL` is scoped to the intended environment. Take the configured database backup before destructive schema changes. Never print `DATABASE_URL` or database credentials in CI logs.
