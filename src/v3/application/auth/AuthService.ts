import type { PasswordHasher, Principal, RoleName } from './AuthTypes'
import { SessionService } from './SessionService'

export interface AuthUser {
  id: string
  username: string
  passwordHash: string
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  roles: RoleName[]
  permissions: string[]
}

export interface UserStore {
  findByUsername(username: string): Promise<AuthUser | null>
  findById(id: string): Promise<AuthUser | null>
}

export class AuthService {
  constructor(private readonly users: UserStore, private readonly passwords: PasswordHasher, private readonly sessions: SessionService) {}

  async login(username: string, password: string, ip?: string, userAgent?: string): Promise<{ principal: Principal; token: string }> {
    const user = await this.users.findByUsername(username)
    if (!user || user.status !== 'ACTIVE' || !(await this.passwords.verify(password, user.passwordHash))) throw new Error('Invalid credentials')
    const { token, session } = await this.sessions.create(user.id, ip, userAgent)
    return { token, principal: this.toPrincipal(user, session.id) }
  }

  async resolve(token: string | undefined): Promise<Principal | null> {
    const session = await this.sessions.resolve(token)
    if (!session) return null
    const user = await this.users.findById(session.userId)
    if (!user || user.status !== 'ACTIVE') return null
    return this.toPrincipal(user, session.id)
  }

  async logout(token: string | undefined): Promise<void> { await this.sessions.revoke(token) }

  private toPrincipal(user: AuthUser, sessionId: string): Principal {
    return { userId: user.id, username: user.username, roles: new Set(user.roles), permissions: new Set(user.permissions), sessionId }
  }
}
