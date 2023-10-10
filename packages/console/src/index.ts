import { Awaitable, Context, Dict, Random, Service, Universal, valueMap } from 'koishi'
import { DataService } from './service'
import { SchemaProvider } from './schema'
import { PermissionProvider } from './permission'
import { Client } from './client'
import { IncomingMessage } from 'http'

export * from './client'
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

export interface Entry {
  dev: string
  prod: string | string[]
}

export interface EntryData {
  files: string[]
  paths?: string[]
}

export class EntryProvider extends DataService<Dict<EntryData>> {
  static using = []

  constructor(ctx: Context) {
    super(ctx, 'entry', { immediate: true })
  }

  async get() {
    return this.ctx.console.get()
  }
}

export abstract class Console extends Service {
  static filter = false

  readonly entries: Dict<[string | string[] | Entry, Context]> = Object.create(null)
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

  async get() {
    return valueMap(this.entries, ([files, context], key) => ({
      files: this.resolveEntry(files, key),
      paths: this.ctx.loader?.paths(context.scope),
    }))
  }

  protected abstract resolveEntry(entry: string | string[] | Entry, key: string): string[]

  addEntry(entry: string | string[] | Entry) {
    const caller = this.caller
    const key = 'extension-' + Random.id()
    this.entries[key] = [entry, this.caller]
    this.entry.refresh()
    caller?.collect('entry', () => {
      const result = delete this.entries[key]
      this.entry?.refresh()
      return result
    })
  }

  addListener<K extends keyof Events>(event: K, callback: Events[K], options?: DataService.Options) {
    this.listeners[event] = { callback, ...options }
  }

  broadcast(type: string, body: any, options: DataService.Options = {}) {
    const handles = Object.values(this.clients)
    if (!handles.length) return
    const data = JSON.stringify({ type, body })
    Promise.all(Object.values(this.clients).map(async (client) => {
      if (await this.ctx.serial('console/intercept', client, options)) return
      client.socket.send(data)
    }))
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
