import type { DrizzleAuditLogStore, AuditRecordInput } from '../../infrastructure/database/repositories/DrizzleAuditLogStore'

/**
 * Fire-and-forget audit trail. Audit failures never block the operation they
 * describe; they are logged to stderr instead.
 */
export class AuditService {
  constructor(private readonly store: DrizzleAuditLogStore) {}

  record(input: AuditRecordInput): void {
    void this.store.record(input).catch((error) => {
      process.stderr.write(`audit write failed for ${input.action}: ${error instanceof Error ? error.message : String(error)}\n`)
    })
  }
}
