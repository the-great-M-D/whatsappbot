import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { SessionRecord } from './AuthTypes'

export interface SessionStore {
  create(input: { userId: string; tokenHash: string; expiresAt: Date; ip?: string; userAgent?: string }): Promise<SessionRecord>
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>
  touch(id: string, lastSeenAt: Date): Promise<void>
  revoke(id: string, revokedAt: Date): Promise<void>
}

export interface SessionCookieConfig {
  name: string
  ttlMs: number
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  path: string
}

export class SessionService {
  constructor(private readonly store: SessionStore, private readonly cookie: SessionCookieConfig) {}

  async create(userId: string, ip?: string, userAgent?: string): Promise<{ token: string; session: SessionRecord }> {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + this.cookie.ttlMs)
    const session = await this.store.create({ userId, tokenHash: SessionService.hashToken(token), expiresAt, ip, userAgent })
    return { token, session }
  }

  async resolve(token: string | undefined): Promise<SessionRecord | null> {
    if (!token) return null
    const session = await this.store.findByTokenHash(SessionService.hashToken(token))
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null
    await this.store.touch(session.id, new Date())
    return session
  }

  async revoke(token: string | undefined): Promise<void> {
    if (!token) return
    const session = await this.store.findByTokenHash(SessionService.hashToken(token))
    if (session && !session.revokedAt) await this.store.revoke(session.id, new Date())
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex')
  }

  static constantTimeTokenMatch(a: string, b: string): boolean {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
  }
}
