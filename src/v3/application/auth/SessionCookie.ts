import type { Request, Response } from 'express'
import type { SessionCookieConfig } from './SessionService'

export function readSessionCookie(request: Request, config: SessionCookieConfig): string | undefined {
  const header = request.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index <= 0) continue
    const name = part.slice(0, index).trim()
    if (name !== config.name) continue
    const value = part.slice(index + 1).trim()
    try { return decodeURIComponent(value) } catch { return undefined }
  }
  return undefined
}

function serializeCookie(name: string, value: string, config: SessionCookieConfig, httpOnly: boolean): string {
  const maxAge = Math.max(0, Math.floor(config.ttlMs / 1000))
  const sameSite = config.sameSite === 'none' ? 'None' : config.sameSite === 'strict' ? 'Strict' : 'Lax'
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${config.path}; SameSite=${sameSite}${config.secure ? '; Secure' : ''}${httpOnly ? '; HttpOnly' : ''}`
}

export function setSessionCookie(response: Response, token: string, config: SessionCookieConfig): void {
  response.append('Set-Cookie', serializeCookie(config.name, token, config, true))
}

export function clearSessionCookie(response: Response, config: SessionCookieConfig): void {
  response.append('Set-Cookie', `${config.name}=; Max-Age=0; Path=${config.path}; SameSite=${config.sameSite === 'none' ? 'None' : config.sameSite === 'strict' ? 'Strict' : 'Lax'}${config.secure ? '; Secure' : ''}; HttpOnly`)
}
