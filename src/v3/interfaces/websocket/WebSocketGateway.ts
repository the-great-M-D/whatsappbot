import { randomUUID } from 'node:crypto'
import type { IncomingMessage, Server as HttpServer } from 'node:http'
import { WebSocketServer, WebSocket, type RawData } from 'ws'
import type { WorkerEventSource, WorkerLifecycleEvent } from '../../application/instances/WorkerManager'
import type { DomainEventMap, EventBus } from '../../domain/events/EventBus'
import type { InstanceRepository } from '../../application/instances/InstanceRepository'

export interface WebSocketPrincipal { userId: string; permissions: Set<string> }
export type WebSocketPrincipalResolver = (request: IncomingMessage) => Promise<WebSocketPrincipal | null> | WebSocketPrincipal | null
interface Client { socket: WebSocket; userId: string; permissions: Set<string>; instances: Set<string>; queue: string[]; flushing: boolean }
interface ClientMessage { id?: string; type?: string; action?: string; instanceId?: string; payload?: unknown }

export class WebSocketGateway {
  private readonly clients = new Set<Client>()
  private readonly wss: WebSocketServer
  private unsubscribe?: () => void
  private domainUnsubscribe?: () => void
  private readonly maxQueue = 500

  constructor(server: HttpServer, private readonly repository: InstanceRepository, private readonly principalResolver: WebSocketPrincipalResolver) {
    this.wss = new WebSocketServer({ server, path: '/api/v1/ws', maxPayload: 64 * 1024 })
    this.wss.on('connection', (socket, request) => void this.authenticate(socket, request))
  }

  attachWorkerEvents(source: WorkerEventSource): () => void {
    this.unsubscribe?.()
    this.unsubscribe = source.onEvent((event) => this.publish(event))
    return this.unsubscribe
  }

  /** Publishes domain events (scanner matches, command runs, tasks, jobs) to subscribed clients. */
  attachEventBus(events: EventBus): () => void {
    this.domainUnsubscribe?.()
    const handlers: Array<[keyof DomainEventMap, (payload: never) => void]> = [
      ['CommandExecuted', (payload) => this.publishDomain('CommandExecuted', payload as unknown as Record<string, unknown>)],
      ['ScannerMatch', (payload) => this.publishDomain('ScannerMatch', payload as unknown as Record<string, unknown>)],
      ['TaskUpdated', (payload) => this.publishDomain('TaskUpdated', payload as unknown as Record<string, unknown>)],
      ['JobExecuted', (payload) => this.publishDomain('JobExecuted', payload as unknown as Record<string, unknown>)],
    ]
    const unsubscribers = handlers.map(([name, handler]) => events.on(name, handler))
    this.domainUnsubscribe = () => { for (const off of unsubscribers) off(); this.domainUnsubscribe = undefined }
    return this.domainUnsubscribe
  }

  async close(): Promise<void> {
    this.unsubscribe?.()
    this.domainUnsubscribe?.()
    for (const client of this.clients) client.socket.close(1001, 'server shutdown')
    await new Promise<void>((resolve) => this.wss.close(() => resolve()))
  }

  private async authenticate(socket: WebSocket, request: IncomingMessage): Promise<void> {
    try {
      const principal = await this.principalResolver(request)
      if (!principal) return socket.close(1008, 'unauthorized')
      const client: Client = { socket, userId: principal.userId, permissions: principal.permissions, instances: new Set(), queue: [], flushing: false }
      this.clients.add(client)
      socket.on('message', (raw) => void this.handle(client, raw))
      socket.on('close', () => this.clients.delete(client))
      this.send(client, { type: 'ready', id: randomUUID(), timestamp: new Date().toISOString(), payload: { protocolVersion: 1 } })
    } catch { socket.close(1011, 'authentication failure') }
  }

  private async handle(client: Client, raw: RawData): Promise<void> {
    try {
      const message = JSON.parse(raw.toString()) as ClientMessage
      const id = message.id ?? randomUUID()
      if (message.type !== 'command') return this.send(client, { type: 'error', id, payload: { code: 'INVALID_MESSAGE' } })
      if (message.action === 'ping') return this.send(client, { type: 'pong', id, timestamp: new Date().toISOString() })
      if (message.action === 'subscribe' || message.action === 'unsubscribe') {
        if (!message.instanceId) return this.send(client, { type: 'error', id, payload: { code: 'INSTANCE_REQUIRED' } })
        const instance = await this.repository.findById(message.instanceId)
        if (!instance) return this.send(client, { type: 'error', id, payload: { code: 'NOT_FOUND' } })
        if (!client.permissions.has('instances:read') && !client.permissions.has('*')) return this.send(client, { type: 'error', id, payload: { code: 'FORBIDDEN' } })
        if (message.action === 'subscribe') client.instances.add(instance.id); else client.instances.delete(instance.id)
        return this.send(client, { type: 'ack', id, instanceId: instance.id, timestamp: new Date().toISOString(), payload: { subscribed: message.action === 'subscribe' } })
      }
      this.send(client, { type: 'error', id, payload: { code: 'UNKNOWN_ACTION' } })
    } catch { this.send(client, { type: 'error', id: randomUUID(), payload: { code: 'INVALID_MESSAGE' } }) }
  }

  private publish(event: WorkerLifecycleEvent): void {
    const payload = this.safeEvent(event)
    if (payload === null) return
    const envelope = { type: 'event', id: randomUUID(), instanceId: event.instanceId, timestamp: new Date().toISOString(), payload }
    for (const client of this.clients) if (client.instances.has(event.instanceId) || client.permissions.has('*')) this.send(client, envelope)
  }

  private publishDomain(name: string, payload: Record<string, unknown>): void {
    const envelope = { type: 'event', id: randomUUID(), instanceId: payload.instanceId as string, timestamp: new Date().toISOString(), payload: { ...payload, type: name } }
    for (const client of this.clients) if (client.instances.has(payload.instanceId as string) || client.permissions.has('*')) this.send(client, envelope)
  }

  private safeEvent(event: WorkerLifecycleEvent): unknown | null {
    if (event.type === 'error') return { type: 'error', message: event.error.message }
    if (event.type !== 'provider') return event
    if (event.event.type === 'message') {
      if (event.event.message.chatType !== 'group') return null
      return { type: 'message', message: event.event.message }
    }
    if (event.event.type === 'qr') return { type: 'qr', qr: event.event.qr }
    if (event.event.type === 'pairing-code') return { type: 'pairing-code', code: event.event.code }
    if (event.event.type === 'connection') return { type: 'connection', state: event.event.state, reason: event.event.reason }
    return event.event
  }

  private send(client: Client, value: unknown): void {
    if (client.socket.readyState !== WebSocket.OPEN) return
    const data = JSON.stringify(value)
    if (client.queue.length >= this.maxQueue) return client.socket.close(1013, 'client too slow')
    client.queue.push(data)
    if (client.flushing) return
    client.flushing = true
    const flush = () => {
      if (client.socket.readyState !== WebSocket.OPEN) { client.flushing = false; return }
      const next = client.queue.shift()
      if (!next) { client.flushing = false; return }
      client.socket.send(next, (error) => { if (error) client.socket.close(1011, 'send failure'); else setImmediate(flush) })
    }
    flush()
  }
}
