import { Awaitable, Context, Dict, Service, Universal, valueMap } from 'koishi'
import { DataService } from './service'
import { SchemaProvider } from './schema'
import { PermissionProvider } from './permission'
import { Client } from './client'
import { IncomingMessage } from 'http'
import { Entry } from './entry'

export * from './client'
export * from './entry'
export * from './service'

type NestedServices = {
  [K in keyof Console.Services as `console.${K}`]: Console.Services[K]
}

declare module 'koishi' {
  interface Context extends NestedServices {
    console: Console
  }

  interface Events {
    'console/connection'(client: Client): void
    'console/intercept'(client: Client, listener: DataService.Options): Awaitable<boolean>
  }
}

export interface Console extends Console.Services {}

export interface Listener extends DataService.Options {
  callback(this: Client, ...args: any[]): Awaitable<any>
}

export interface EntryData {
  files: string[]
  paths?: string[]
  data: () => any
}

export class EntryProvider extends DataService<Dict<EntryData>> {
  static inject = []

  constructor(ctx: Context) {
    super(ctx, 'entry', { immediate: true })
  }

  async get(forced: boolean, client: Client) {
    return this.ctx.get('console').get(client)
  }
}

export abstract class Console extends Service {
  static filter = false

  private id = Math.random().toString(36).slice(2)

  readonly entries: Dict<Entry> = Object.create(null)
  readonly listeners: Dict<Listener> = Object.create(null)
  readonly clients: Dict<Client> = Object.create(null)

  constructor(public ctx: Context) {
    super(ctx, 'console', true)
    ctx.plugin(EntryProvider)
    ctx.plugin(SchemaProvider)
    ctx.plugin(PermissionProvider)
    this.addListener('ping', () => 'pong')
  }

  protected accept(socket: Universal.WebSocket, request?: IncomingMessage) {
    const client = new Client(this.ctx, socket, request)
    socket.addEventListener('close', () => {
      delete this.clients[client.id]
      this.ctx.emit('console/connection', client)
    })
    this.clients[client.id] = client
    this.ctx.emit('console/connection', client)
  }

  async get(client: Client) {
    const result = valueMap(this.entries, ({ files, ctx, data }, key) => ({
      files: this.resolveEntry(files, key),
      paths: this.ctx.get('loader')?.paths(ctx.scope),
      data: data?.(client),
    }))
    result['_id'] = this.id as any
    return result
  }

  protected abstract resolveEntry(files: Entry.Files, key: string): string[]

  addEntry<T>(files: Entry.Files, data?: () => T) {
    return new Entry(this[Context.current], files, data)
  }

  addListener<K extends keyof Events>(event: K, callback: Events[K], options?: DataService.Options) {
    this.listeners[event] = { callback, ...options }
  }

  async broadcast(type: string, body: any, options: DataService.Options = {}) {
    const handles = Object.values(this.clients)
    if (!handles.length) return
    await Promise.all(Object.values(this.clients).map(async (client) => {
      if (await this.ctx.serial('console/intercept', client, options)) return
      const data = { type, body }
      if (typeof body === 'function') data.body = await body(client)
      client.socket.send(JSON.stringify(data))
    }))
  }

  refresh<K extends keyof Console.Services>(type: K) {
    return this.ctx.get(`console.${type}`)?.refresh()
  }

  patch<K extends keyof Console.Services>(type: K, value: Console.Services[K] extends DataService<infer T> ? T : never) {
    return this.ctx.get(`console.${type}`)?.patch(value as any)
  }
}

export interface Events {
  'ping'(): string
}

export namespace Console {
  export interface Services {
    entry: EntryProvider
    schema: SchemaProvider
    permissions: PermissionProvider
  }
}

export default Console
