import { eq } from 'drizzle-orm'
import type { AuthUser, UserStore } from '../../../application/auth/AuthService'
import type { RoleName } from '../../../application/auth/AuthTypes'
import { permissions, roles, rolePermissions, userRoles, users } from '../schema'
import type { V3Database } from '../client'

export class DrizzleUserStore implements UserStore {
  constructor(private readonly db: V3Database) {}

  async findByUsername(username: string): Promise<AuthUser | null> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username)).limit(1)
    return user ? this.loadAuthUser(user) : null
  }

  async findById(id: string): Promise<AuthUser | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return user ? this.loadAuthUser(user) : null
  }

  private async loadAuthUser(user: typeof users.$inferSelect): Promise<AuthUser> {
    const rows = await this.db.select({ role: roles.name, permission: permissions.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, user.id))

    const roleNames = [...new Set(rows.map((row) => row.role).filter(Boolean) as RoleName[])]
    const permissionNames = new Set(rows.map((row) => row.permission).filter(Boolean) as string[])
    // OWNER holds the wildcard grant at role level; role_permissions rows skip '*'.
    if (roleNames.includes('OWNER')) permissionNames.add('*')
    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      status: user.status,
      roles: roleNames,
      permissions: [...permissionNames],
    }
  }
}
