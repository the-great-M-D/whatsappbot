import { seedDefaultRbac } from './SeedDefaults'
import type { V3Database } from './client'

export async function runRbacSeed(db: V3Database): Promise<void> {
  await seedDefaultRbac(db)
}
