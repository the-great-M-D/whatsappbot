import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConfigService } from '../../app/config/ConfigService'

const baseEnv = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/kaoi',
  CSRF_SECRET: '0123456789abcdef0123456789abcdef',
}

test('config applies documented defaults', () => {
  const config = ConfigService.fromEnv({ ...baseEnv })
  assert.equal(config.value.NODE_ENV, 'development')
  assert.equal(config.value.DATABASE_POOL_MAX, 5)
  assert.equal(config.value.SESSION_COOKIE_NAME, 'v3_session')
  assert.equal(config.value.SESSION_TTL_MS, 86_400_000)
  assert.equal(config.value.SESSION_SECURE, true)
  assert.equal(config.value.PORT, 3000)
  assert.equal(config.value.LOG_LEVEL, 'info')
})

test('config rejects a missing DATABASE_URL', () => {
  assert.throws(() => ConfigService.fromEnv({ CSRF_SECRET: baseEnv.CSRF_SECRET }), /DATABASE_URL/)
})

test('config rejects a weak CSRF secret', () => {
  assert.throws(() => ConfigService.fromEnv({ ...baseEnv, CSRF_SECRET: 'short' }), /CSRF_SECRET/)
})

test('config coerces numeric env strings and validates ranges', () => {
  const config = ConfigService.fromEnv({ ...baseEnv, PORT: '8080', DATABASE_POOL_MAX: '10' })
  assert.equal(config.value.PORT, 8080)
  assert.equal(config.value.DATABASE_POOL_MAX, 10)
  assert.throws(() => ConfigService.fromEnv({ ...baseEnv, PORT: '99999' }), /PORT/)
})

test('config rejects unknown NODE_ENV values', () => {
  assert.throws(() => ConfigService.fromEnv({ ...baseEnv, NODE_ENV: 'staging' }), /NODE_ENV/)
})

test('config flags production and toggles secure cookies via env', () => {
  const prod = ConfigService.fromEnv({ ...baseEnv, NODE_ENV: 'production' })
  assert.equal(prod.isProduction, true)
  const insecure = ConfigService.fromEnv({ ...baseEnv, SESSION_SECURE: 'false' })
  assert.equal(insecure.value.SESSION_SECURE, false)
})

test('session backup key is optional but must be strong when present', () => {
  const withKey = ConfigService.fromEnv({ ...baseEnv, SESSION_BACKUP_KEY: 'a'.repeat(32) })
  assert.equal(withKey.value.SESSION_BACKUP_KEY, 'a'.repeat(32))
  const withoutKey = ConfigService.fromEnv({ ...baseEnv })
  assert.equal(withoutKey.value.SESSION_BACKUP_KEY, undefined)
  assert.throws(() => ConfigService.fromEnv({ ...baseEnv, SESSION_BACKUP_KEY: 'too-short' }), /SESSION_BACKUP_KEY/)
})
