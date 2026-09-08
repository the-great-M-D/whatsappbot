import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type V3Database = NodePgDatabase<typeof schema>

export interface DatabaseHandle {
  db: V3Database
  pool: Pool
  close(): Promise<void>
}

export function createDatabase(connectionString: string, max = 5): DatabaseHandle {
  if (!connectionString) throw new Error('DATABASE_URL is required')

  const pool = new Pool({
    connectionString,
    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 30_000,
  })

  return {
    db: drizzle(pool, { schema }),
    pool,
    close: () => pool.end(),
  }
}
