import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { RequestHandler, Request, Response } from 'express'
import type { AuthService } from '../../application/auth/AuthService'
import type { Principal } from '../../application/auth/AuthTypes'
import type { SessionCookieConfig } from '../../application/auth/SessionService'
import { readSessionCookie } from '../../application/auth/SessionCookie'

export const principalKey = 'v3Principal'
export const csrfCookieName = 'v3_csrf'

export function createAuthMiddleware(options: { auth: AuthService; cookie: SessionCookieConfig }): RequestHandler {
  return async (req, res, next) => {
    try {
      const principal = await options.auth.resolve(readSessionCookie(req, options.cookie))
      if (!principal) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required', requestId: res.locals.requestId } })
      res.locals[principalKey] = principal
      next()
    } catch (error) { next(error) }
  }
}

export function getPrincipal(res: Response): Principal | null {
  return (res.locals[principalKey] as Principal | undefined) ?? null
}

export function requirePermission(permission: string): RequestHandler {
  return (_req, res, next) => {
    const principal = getPrincipal(res)
    if (!principal) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required', requestId: res.locals.requestId } })
    if (!principal.permissions.has('*') && !principal.permissions.has(permission)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permission', requestId: res.locals.requestId } })
    next()
  }
}

export function issueCsrfCookie(res: Response, secret: string, sessionId: string, secure: boolean): void {
  const nonce = randomBytes(24).toString('base64url')
  const token = `${nonce}.${hmac(secret, sessionId, nonce)}`
  res.append('Set-Cookie', `${csrfCookieName}=${encodeURIComponent(token)}; Max-Age=86400; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`)
}

export function csrfProtection(secret: string): RequestHandler {
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next()
    const principal = getPrincipal(res)
    if (!principal) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required', requestId: res.locals.requestId } })
    const cookieToken = readCookie(req, csrfCookieName)
    const headerToken = typeof req.headers['x-csrf-token'] === 'string' ? req.headers['x-csrf-token'] : ''
    const cookieBytes = Buffer.from(cookieToken ?? '')
    const headerBytes = Buffer.from(headerToken)
    const sameToken = cookieBytes.length === headerBytes.length && cookieBytes.length > 0 && timingSafeEqual(cookieBytes, headerBytes)
    if (!sameToken || !verifyCsrf(secret, principal.sessionId, cookieToken ?? '')) {
      return res.status(403).json({ error: { code: 'CSRF_INVALID', message: 'Invalid CSRF token', requestId: res.locals.requestId } })
    }
    next()
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()) } catch { return undefined }
    }
  }
  return undefined
}

function hmac(secret: string, sessionId: string, nonce: string): string {
  return createHmac('sha256', secret).update(sessionId).update('.').update(nonce).digest('base64url')
}

function verifyCsrf(secret: string, sessionId: string, token: string): boolean {
  const i = token.lastIndexOf('.')
  if (i <= 0) return false
  const nonce = token.slice(0, i)
  const supplied = token.slice(i + 1)
  const expected = hmac(secret, sessionId, nonce)
  const a = Buffer.from(supplied)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
