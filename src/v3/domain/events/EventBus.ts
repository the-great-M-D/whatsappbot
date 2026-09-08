export type EventHandler<T> = (event: T) => void | Promise<void>

export interface DomainEventMap {
    MessageReceived: {
        instanceId: string
        messageId: string
        chatId: string
        senderId: string
        chatType: 'private' | 'group'
        timestamp: number
        text?: string
        isFromMe: boolean
    }
    ConnectionChanged: {
        instanceId: string
        state: string
        reason?: string
    }
    PairingRequired: {
        instanceId: string
        method: 'qr' | 'phone'
    }
    CommandExecuted: {
        instanceId: string
        command: string
        success: boolean
        durationMs: number
    }
    ScannerMatch: {
        instanceId: string
        source: string
        eventId: string
        matchedText: string
        timestamp: number
    }
    WorkerError: {
        instanceId: string
        code: string
        message: string
    }
}

/** In-process V1 event bus. Subscribers are isolated and never block publishers. */
export class EventBus<Events extends Record<string, unknown> = DomainEventMap> {
    private readonly handlers = new Map<keyof Events, Set<EventHandler<any>>>()

    on<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): () => void {
        const set = this.handlers.get(type) ?? new Set<EventHandler<any>>()
        set.add(handler)
        this.handlers.set(type, set)
        return () => set.delete(handler)
    }

    emit<K extends keyof Events>(type: K, event: Events[K]): void {
        const subscribers = [...(this.handlers.get(type) ?? [])]
        for (const handler of subscribers) {
            Promise.resolve().then(() => handler(event)).catch(() => undefined)
        }
    }

    clear(): void {
        this.handlers.clear()
    }
}
