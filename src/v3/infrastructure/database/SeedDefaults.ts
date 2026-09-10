import { permissions, roles, rolePermissions } from './schema'
import type { V3Database } from './client'

// Keep in sync with the permission strings required by ApiServer route guards
// and WebSocketGateway checks (src/v3/interfaces/*).
const INSTANCE_PERMISSIONS = [
  'instances:read', 'instances:create', 'instances:update', 'instances:delete',
  'instances:start', 'instances:stop', 'instances:restart', 'instances:reconnect',
]
const DEFAULT_PERMISSIONS = [
  'dashboard:read',
  ...INSTANCE_PERMISSIONS,
  'scanner:read', 'scanner:manage',
  'tasks:read', 'jobs:read', 'jobs:manage',
  'audit:read', 'users:manage', 'system:manage',
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'],
  ADMIN: DEFAULT_PERMISSIONS,
  OPERATOR: ['dashboard:read', ...INSTANCE_PERMISSIONS, 'scanner:read', 'scanner:manage', 'tasks:read', 'jobs:read'],
  VIEWER: ['dashboard:read', 'instances:read', 'scanner:read', 'tasks:read', 'jobs:read'],
}

export async function seedDefaultRbac(db: V3Database): Promise<void> {
  const permissionNames = [...DEFAULT_PERMISSIONS]
  for (const name of permissionNames) {
    await db.insert(permissions).values({ name }).onConflictDoNothing({ target: permissions.name })
  }

  for (const name of Object.keys(ROLE_PERMISSIONS)) {
    await db.insert(roles).values({ name, description: `V3 ${name} role` }).onConflictDoNothing({ target: roles.name })
  }

  const allPermissions = await db.select({ id: permissions.id, name: permissions.name }).from(permissions)
  const allRoles = await db.select({ id: roles.id, name: roles.name }).from(roles)
  const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]))
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]))

  for (const [roleName, names] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName)
    if (!roleId) continue
    for (const permissionName of names) {
      if (permissionName === '*') continue
      const permissionId = permissionMap.get(permissionName)
      if (permissionId) await db.insert(rolePermissions).values({ roleId, permissionId }).onConflictDoNothing()
    }
  }
}
