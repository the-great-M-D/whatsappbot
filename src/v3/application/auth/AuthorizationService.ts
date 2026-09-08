import type { Principal } from './AuthTypes'

export class AuthorizationService {
  has(principal: Principal, permission: string): boolean {
    return principal.permissions.has('*') || principal.permissions.has(permission)
  }

  require(principal: Principal | null, permission: string): void {
    if (!principal) throw new Error('UNAUTHENTICATED')
    if (!this.has(principal, permission)) throw new Error('FORBIDDEN')
  }

  canAccessInstance(principal: Principal, instanceId: string, memberships: Set<string>): boolean {
    return this.has(principal, 'instances:read') && (this.has(principal, 'instances:all') || memberships.has(instanceId))
  }
}
