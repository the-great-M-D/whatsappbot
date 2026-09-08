# V3 authentication boundary

The V3 dashboard authentication model uses PostgreSQL-backed users and opaque, hashed browser session tokens.

- Sessions are never stored as plaintext tokens.
- Session records contain expiry, last-seen, IP/user-agent metadata, and revocation state.
- `AuthService` is independent of Express and WebSocket transports.
- Password hashing is an injectable `PasswordHasher` contract.
- `ScryptPasswordHasher` is provided as a dependency-free Node.js fallback for development/compatibility.
- Production password policy is Argon2id; deploy an Argon2id `PasswordHasher` implementation before enabling production account creation/login.
- Disabled, suspended, and invited users cannot authenticate.

This stage deliberately does not create a bootstrap administrator or expose a password-reset flow. Those operations require explicit deployment-time provisioning and rate limiting.
