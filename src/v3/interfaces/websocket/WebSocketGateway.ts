import { randomUUID } from 'node:crypto'
import type { Server as HttpServer } from 'node:http'
import { WebSocketServer, WebSocket, type RawData } from 'ws'
import type { WorkerEventSource, WorkerLifecycleEvent } from '../../application/instances/WorkerManager'
import type { InstanceRepository } from '../../application/instances/InstanceRepository'
import type { PrincipalResolver } from '../http/ApiServer'

interface Client { socket: WebSocket; userId: string; permissions: Set<string>; instances: Set<string>; queue: string[]; flushing: boolean }
interface ClientMessage { id?: string; type?: string; action?: string; instanceId?: string; payload?: unknown }

export class WebSocketGateway {
  private readonly clients = new Set<Client>()
  private readonly wss: WebSocketServer
  private readonly unsubscribe: () => void
  private readonly maxQueue = 500

  constructor(server: HttpServer, private readonly repository: InstanceRepository, private readonly principalResolver: PrincipalResolver) {
    this.wss = new WebSocketServer({ server, path: '/api/v1/ws', maxPayload: 64 * 1024 })
    this.wss.on('connection', (socket, request) => void this.authenticate(socket, request))
    const source = repository as InstanceRepository & Partial<WorkerEventSource>
    this.unsubscribe = typeof source.onEvent === 'function' ? source.onEvent((event) => this.publish(event)) : () => undefined
  }

  async close(): Promise<void> {
    this.unsubscribe()
    for (const client of this.clients) client.socket.close(1001, 'server shutdown')
    await new Promise<void>((resolve) => this.wss.close(() => resolve()))
  }

  attachWorkerEvents(source: WorkerEventSource): () => void {
    return source.onEvent((event) => this.publish(event))
  }

  private async authenticate(socket: WebSocket, request: import('node:http').IncomingMessage): Promise<void> {
    try {
      const principal = await this.principalResolver(request as any)
      if (!principal) return socket.close(1008, 'unauthorized')
      const client: Client = { socket, userId: principal.userId, permissions: principal.permissions, instances: new Set(), queue: [], flushing: false }
      this.clients.add(client)
      socket.on('message', (raw) => void this.handle(client, raw))
      socket.on('close', () => this.clients.delete(client))
      this.send(client, { type: 'ready', id: randomUUID(), payload: { protocolVersion: 1 } })
    } catch { socket.close(1011, 'authentication failure') }
  }

  private async handle(client: Client, raw: RawData): Promise<void> {
    try {
      const message = JSON.parse(raw.toString()) as ClientMessage
      if (message.type !== 'command') return this.send(client, { type: 'error', id: message.id ?? randomUUID(), payload: { code: 'INVALID_MESSAGE' } })
      if (message.action === 'ping') return this.send(client, { type: 'pong', id: message.id ?? randomUUID() })
      if (message.action === 'subscribe' || message.action === 'unsubscribe') {
        if (!message.instanceId) return this.send(client, { type: 'error', id: message.id ?? randomUUID(), payload: { code: 'INSTANCE_REQUIRED' } })
        const instance = await this.repository.findById(message.instanceId)
        if (!instance) return this.send(client, { type: 'error', id: message.id ?? randomUUID(), payload: { code: 'NOT_FOUND' } })
        if (!client.permissions.has('instances:read') && !client.permissions.has('*')) return this.send(client, { type: 'error', id: message.id ?? randomUUID(), payload: { code: 'FORBIDDEN' } })
        if (message.action === 'subscribe') client.instances.add(instance.id); else client.instances.delete(instance.id)
        return this.send(client, { type: 'ack', id: message.id ?? randomUUID(), instanceId: instance.id, payload: { subscribed: message.action === 'subscribe' } })
      }
      this.send(client, { type: 'error', id: message.id ?? randomUUID(), payload: { code: 'UNKNOWN_ACTION' } })
    } catch { this.send(client, { type: 'error', id: randomUUID(), payload: { code: 'INVALID_MESSAGE' } }) }
  }

  private publish(event: WorkerLifecycleEvent): void {
    const envelope = { id: randomUUID(), type: 'event', instanceId: event.instanceId, timestamp: new Date().toISOString(), payload: this.safeEvent(event) }
    for (const client of this.clients) if (client.instances.has(event.instanceId) || client.permissions.has('*')) this.send(client, envelope)
  }

  private safeEvent(event: WorkerLifecycleEvent): unknown {
    if (event.type === 'error') return { type: 'error', message: event.error.message }
    return event
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
