import { Awaitable, Context, Dict, makeArray, Random, Service } from 'koishi'
import { DataService } from './service'
import { AbstractWebSocket } from './types'
import { SchemaProvider } from './schema'
import { Client } from './client'
import NodeConsole from '../node'

export * from './client'
export * from './service'
export * from './types'

type NestedServices = {
  [K in keyof Console.Services as `console.${K}`]: Console.Services[K]
}

declare module 'koishi' {
  interface Context extends NestedServices {
    console: NodeConsole
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

export class EntryProvider extends DataService<string[]> {
  constructor(ctx: Context) {
    super(ctx, 'entry', { immediate: true })
  }

  async get() {
    return this.ctx.console.get()
  }
}

export abstract class Console extends Service {
  static filter = false

  readonly entries: Dict<string[]> = Object.create(null)
  readonly listeners: Dict<Listener> = Object.create(null)
  readonly clients: Dict<Client> = Object.create(null)

  constructor(public ctx: Context) {
    super(ctx, 'console', true)
    ctx.plugin(EntryProvider)
    ctx.plugin(SchemaProvider)
    this.addListener('ping', () => 'pong')
  }

  protected accept(socket: AbstractWebSocket) {
    const client = new Client(this.ctx, socket)
    socket.addEventListener('close', () => {
      delete this.clients[client.id]
      this.ctx.emit('console/connection', client)
    })
    this.clients[client.id] = client
    this.ctx.emit('console/connection', client)
  }

  async get() {
    return Object.values(this.entries).flat()
  }

  abstract resolveEntry(entry: string | string[] | Entry): string | string[]

  addEntry(entry: string | string[] | Entry) {
    const caller = this.caller
    const key = 'extension-' + Random.id()
    this.entries[key] = makeArray(this.resolveEntry(entry))
    this.entry.refresh()
    caller?.on('dispose', () => {
      delete this.entries[key]
      this.entry?.refresh()
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
  }
}

export default Console
