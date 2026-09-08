Authentication foundation security contract.

Session tokens are random opaque values; only SHA-256 token hashes are persisted. Session records expire and support explicit revocation. User status is checked on login and session resolution. Password hashing is injected; the included scrypt adapter is development compatibility only. Production must use Argon2id, HTTPS Secure/HttpOnly/SameSite cookies, CSRF protection, login/reset rate limits, and redacted authentication logging.
