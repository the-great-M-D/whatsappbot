import 'dotenv/config'
import { createDatabase } from '../src/v3/infrastructure/database/client'
import { seedDefaultRbac } from '../src/v3/infrastructure/database/SeedDefaults'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required')
  const { db, pool } = createDatabase(url, Number(process.env.DATABASE_POOL_MAX || 5))
  try {
    await seedDefaultRbac(db)
    console.log('V3 RBAC defaults seeded.')
  } finally {
    await pool.end()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
