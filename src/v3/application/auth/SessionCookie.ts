import type { Response } from 'express'
import type { SessionCookieConfig } from './SessionService'

export function setSessionCookie(response: Response, token: string, config: SessionCookieConfig): void {
  response.cookie(config.name, token, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: config.ttlMs,
    path: config.path,
  })
}

export function clearSessionCookie(response: Response, config: SessionCookieConfig): void {
  response.clearCookie(config.name, { httpOnly: true, secure: config.secure, sameSite: config.sameSite, path: config.path })
}
