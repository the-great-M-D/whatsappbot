export type RoleName = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER'

export interface Principal {
  userId: string
  username: string
  roles: Set<RoleName>
  permissions: Set<string>
  sessionId: string
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, encodedHash: string): Promise<boolean>
}

export interface SessionRecord {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  lastSeenAt: Date
  revokedAt: Date | null
}
