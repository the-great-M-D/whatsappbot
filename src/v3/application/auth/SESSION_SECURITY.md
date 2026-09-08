# Session security

The dashboard session token is a 256-bit opaque random value. Only its SHA-256 digest is persisted in PostgreSQL. Sessions expire and can be explicitly revoked.

Production requirements:

1. Use an Argon2id implementation for `PasswordHasher`.
2. Serve dashboard/API over HTTPS so the session cookie can be `Secure`.
3. Use `HttpOnly`, `SameSite=Strict`, and a narrow `/api` or dashboard cookie path as appropriate.
4. Add CSRF protection to state-changing cookie-authenticated routes before production exposure.
5. Rate-limit login and password-reset endpoints.
6. Never log session tokens, password hashes, TOTP secrets, or authentication headers.
