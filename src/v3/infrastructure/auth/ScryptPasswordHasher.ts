import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { PasswordHasher } from '../../application/auth/AuthTypes'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const SALT_LENGTH = 16

/** Compatibility-safe fallback. Production policy should use Argon2id when the deployment provides it. */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    if (!password || password.length < 12) throw new Error('Password must be at least 12 characters')
    const salt = randomBytes(SALT_LENGTH)
    const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer
    return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, saltText, keyText] = encodedHash.split('$')
    if (algorithm !== 'scrypt' || !saltText || !keyText) return false
    try {
      const salt = Buffer.from(saltText, 'base64url')
      const expected = Buffer.from(keyText, 'base64url')
      const actual = await scrypt(password, salt, expected.length) as Buffer
      return actual.length === expected.length && timingSafeEqual(actual, expected)
    } catch { return false }
  }
}
