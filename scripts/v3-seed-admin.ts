import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { createDatabase } from '../src/v3/infrastructure/database/client'
import { users, roles, userRoles } from '../src/v3/infrastructure/database/schema'
import { Argon2idPasswordHasher } from '../src/v3/infrastructure/auth/Argon2idPasswordHasher'

/**
 * Idempotent admin bootstrap. Creates (or updates) the ADMIN_USERNAME user
 * with an ACTIVE status and the OWNER role, so a freshly-migrated database
 * has a way to log in to the dashboard.
 *
 * Required env:
 *   DATABASE_URL
 *   ADMIN_USERNAME
 *   ADMIN_PASSWORD  (min 12 characters)
 */
async function main() {
  const url = process.env.DATABASE_URL
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!url) throw new Error('DATABASE_URL is required')
  if (!username || !password) {
    console.warn('ADMIN_USERNAME/ADMIN_PASSWORD not set - skipping admin bootstrap (login will not be possible until set).')
    return
  }

  const { db, pool } = createDatabase(url, Number(process.env.DATABASE_POOL_MAX || 5))
  try {
    const hasher = new Argon2idPasswordHasher()
    const passwordHash = await hasher.hash(password)

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)

    let userId: string
    if (existing) {
      await db.update(users).set({ passwordHash, status: 'ACTIVE' }).where(eq(users.id, existing.id))
      userId = existing.id
      console.log(`Admin user '${username}' updated (password reset to ADMIN_PASSWORD).`)
    } else {
      const [created] = await db
        .insert(users)
        .values({ username, passwordHash, status: 'ACTIVE' })
        .returning({ id: users.id })
      userId = created.id
      console.log(`Admin user '${username}' created with OWNER role.`)
    }

    const [ownerRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'OWNER')).limit(1)
    if (ownerRole) {
      await db
        .insert(userRoles)
        .values({ userId, roleId: ownerRole.id })
        .onConflictDoNothing()
      console.log('OWNER role attached.')
    } else {
      console.warn('OWNER role not found — run `npm run v3:seed:rbac` first.')
    }
    console.log('V3 admin bootstrap complete.')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
