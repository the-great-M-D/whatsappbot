# Production gap

The current branch establishes the authentication/session interfaces and PostgreSQL persistence boundary. It intentionally does not enable login in the running V2 process.

Before production dashboard authentication is enabled, wire `AuthService` into the V3 API composition root, replace `ScryptPasswordHasher` with an Argon2id implementation, add CSRF middleware for cookie-authenticated mutations, and add login/password-reset rate limiting.
