import argon2 from 'argon2'
import type { PasswordHasher } from '../../application/auth/AuthTypes'

export class Argon2idPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    if (password.length < 12) throw new Error('Password must be at least 12 characters')
    return argon2.hash(password, {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
      type: argon2.argon2id,
    })
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    if (!password || !encodedHash) return false
    try {
      return await argon2.verify(encodedHash, password)
    } catch {
      return false
    }
  }
}
