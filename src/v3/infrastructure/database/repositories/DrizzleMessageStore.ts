import { and, count, desc, eq, lt } from 'drizzle-orm'
import { messages } from '../schema'
import type { V3Database } from '../client'
import type { WhatsAppMessage } from '../../../domain/whatsapp/WhatsAppProvider'

export interface StoredMessage {
  id: string
  instanceId: string
  whatsappMessageId: string
  senderJid: string
  text: string | null
  createdAt: string
}

export interface MessageListOptions {
  limit?: number
  before?: string
}

/** Persists inbound WhatsApp messages for history and dashboard feeds. */
export class DrizzleMessageStore {
  constructor(private readonly db: V3Database) {}

  async record(instanceId: string, message: WhatsAppMessage, groupId?: string | null): Promise<void> {
    await this.db.insert(messages).values({
      instanceId,
      groupId: groupId ?? null,
      whatsappMessageId: message.id.slice(0, 255),
      senderJid: message.senderId.slice(0, 180),
      text: message.text ?? null,
      metadata: { chatId: message.chatId, chatType: message.chatType, timestamp: message.timestamp, isFromMe: message.isFromMe },
    }).onConflictDoNothing({ target: [messages.instanceId, messages.whatsappMessageId] })
  }

  async list(instanceId: string, options: MessageListOptions = {}): Promise<StoredMessage[]> {
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 500)
    const conditions = [eq(messages.instanceId, instanceId)]
    if (options.before) {
      const [cursor] = await this.db.select({ createdAt: messages.createdAt }).from(messages)
        .where(and(eq(messages.instanceId, instanceId), eq(messages.id, options.before))).limit(1)
      if (cursor) conditions.push(lt(messages.createdAt, cursor.createdAt))
    }
    const rows = await this.db.select({
      id: messages.id,
      instanceId: messages.instanceId,
      whatsappMessageId: messages.whatsappMessageId,
      senderJid: messages.senderJid,
      text: messages.text,
      createdAt: messages.createdAt,
    }).from(messages).where(and(...conditions)).orderBy(desc(messages.createdAt)).limit(limit)
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
  }

  async count(instanceId: string): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(messages).where(eq(messages.instanceId, instanceId))
    return Number(row?.value ?? 0)
  }
}
