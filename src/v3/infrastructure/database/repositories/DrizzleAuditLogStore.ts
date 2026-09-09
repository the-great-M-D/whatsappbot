import { and, desc, eq } from 'drizzle-orm'
import { auditLogs } from '../schema'
import type { V3Database } from '../client'

export interface AuditRecordInput {
  actorType: 'user' | 'system' | 'worker'
  actorId?: string | null
  instanceId?: string | null
  action: string
  target?: string | null
  result: 'SUCCESS' | 'FAILURE' | 'DENIED'
  requestId?: string | null
  ip?: string | null
  metadata?: Record<string, unknown>
}

export interface AuditRecord {
  id: string
  actorType: string
  actorId: string | null
  instanceId: string | null
  action: string
  target: string | null
  result: string
  createdAt: string
  metadata: Record<string, unknown>
}

export interface AuditQuery {
  actorId?: string
  instanceId?: string
  limit?: number
}

/** Append-only audit trail for every security-relevant mutation. */
export class DrizzleAuditLogStore {
  constructor(private readonly db: V3Database) {}

  async record(input: AuditRecordInput): Promise<void> {
    await this.db.insert(auditLogs).values({
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      instanceId: input.instanceId ?? null,
      action: input.action.slice(0, 160),
      target: input.target?.slice(0, 255) ?? null,
      result: input.result,
      requestId: input.requestId?.slice(0, 120) ?? null,
      ip: input.ip?.slice(0, 64) ?? null,
      metadata: input.metadata ?? {},
    })
  }

  async list(query: AuditQuery = {}): Promise<AuditRecord[]> {
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500)
    const conditions = []
    if (query.actorId) conditions.push(eq(auditLogs.actorId, query.actorId))
    if (query.instanceId) conditions.push(eq(auditLogs.instanceId, query.instanceId))
    const rows = await this.db.select({
      id: auditLogs.id,
      actorType: auditLogs.actorType,
      actorId: auditLogs.actorId,
      instanceId: auditLogs.instanceId,
      action: auditLogs.action,
      target: auditLogs.target,
      result: auditLogs.result,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs).where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt)).limit(limit)
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
  }
}
