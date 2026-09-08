import type { WorkerEventSource } from './WorkerManager'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'

export interface PairingSnapshot {
  instanceId: string
  state: string
  qr: string | null
  updatedAt: Date
}

export class PairingService {
  private readonly snapshots = new Map<string, PairingSnapshot>()
  private readonly listeners = new Set<(snapshot: PairingSnapshot) => void>()

  constructor(source: WorkerEventSource) {
    source.onEvent((event) => {
      if (event.type === 'state') this.update(event.instanceId, event.state, null)
      if (event.type === 'provider') {
        const provider = event.event as WhatsAppProviderEvent
        if (provider.type === 'qr') this.update(event.instanceId, 'PAIRING', provider.qr)
        else if (provider.type === 'connection') this.update(event.instanceId, provider.state, null)
      }
    })
  }

  get(instanceId: string): PairingSnapshot {
    return this.snapshots.get(instanceId) ?? { instanceId, state: 'STOPPED', qr: null, updatedAt: new Date(0) }
  }

  subscribe(listener: (snapshot: PairingSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private update(instanceId: string, state: string, qr: string | null): void {
    const previous = this.get(instanceId)
    const snapshot = { instanceId, state, qr: qr ?? (state === 'PAIRING' ? previous.qr : null), updatedAt: new Date() }
    this.snapshots.set(instanceId, snapshot)
    for (const listener of this.listeners) listener(snapshot)
  }
}
