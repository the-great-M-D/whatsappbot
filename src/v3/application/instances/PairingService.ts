import type { WorkerEventSource } from './WorkerManager'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'

export interface PairingSnapshot {
  instanceId: string
  state: string
  qr: string | null
  pairingCode: string | null
  updatedAt: Date
}

export interface PairingRequest { method: 'qr' | 'phone'; phoneNumber?: string }
export type PairWorker = (instanceId: string, request: PairingRequest) => Promise<void>

export class PairingService {
  private readonly snapshots = new Map<string, PairingSnapshot>()
  private readonly listeners = new Set<(snapshot: PairingSnapshot) => void>()

  constructor(source: WorkerEventSource, private readonly pairWorker?: PairWorker) {
    source.onEvent((event) => {
      if (event.type === 'state') this.update(event.instanceId, event.state, null, null)
      if (event.type === 'provider') {
        const provider = event.event as WhatsAppProviderEvent
        if (provider.type === 'qr') this.update(event.instanceId, 'PAIRING', provider.qr, null)
        else if (provider.type === 'pairing-code') this.update(event.instanceId, 'PAIRING', null, provider.code)
        else if (provider.type === 'connection') this.update(event.instanceId, provider.state, null, null)
      }
    })
  }

  async pair(instanceId: string, request: PairingRequest): Promise<void> {
    if (!this.pairWorker) throw new Error('Pairing is not configured')
    await this.pairWorker(instanceId, request)
  }

  get(instanceId: string): PairingSnapshot {
    return this.snapshots.get(instanceId) ?? { instanceId, state: 'STOPPED', qr: null, pairingCode: null, updatedAt: new Date(0) }
  }

  subscribe(listener: (snapshot: PairingSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private update(instanceId: string, state: string, qr: string | null, pairingCode: string | null): void {
    const previous = this.get(instanceId)
    const snapshot = {
      instanceId,
      state,
      qr: qr ?? (state === 'PAIRING' ? previous.qr : null),
      pairingCode: pairingCode ?? (state === 'PAIRING' ? previous.pairingCode : null),
      updatedAt: new Date(),
    }
    this.snapshots.set(instanceId, snapshot)
    for (const listener of this.listeners) listener(snapshot)
  }
}
