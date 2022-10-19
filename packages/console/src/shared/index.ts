import { Awaitable, coerce, Context, Dict, Logger, makeArray, Random, Service } from 'koishi'
import { DataService } from './service'
import NodeConsole from '../node'

export * from './service'

export interface AbstractWebSocket {
  onopen(event: any): void
  onerror(event: any): void
  onmessage(event: any): void
  onclose(event: any): void
  send(data: string): void
  addEventListener(event: string, listener: (event: any) => void): void
  removeEventListener(event: string, listener: (event: any) => void): void
}

type NestedServices = {
  [K in keyof Console.Services as `console.${K}`]: Console.Services[K]
}

declare module 'koishi' {
  interface Context extends NestedServices {
    console: NodeConsole
  }

  interface Events {
    'console/intercept'(handle: SocketHandle, listener: DataService.Options): Awaitable<boolean>
  }
}

export interface Console extends Console.Services {}

export interface Listener extends DataService.Options {
  callback(this: SocketHandle, ...args: any[]): Awaitable<any>
}

const logger = new Logger('console')

export class SocketHandle {
  readonly id: string = Random.id()

  constructor(readonly ctx: Context, public socket: AbstractWebSocket) {
    socket.onmessage = this.receive.bind(this)
    ctx.on('ready', () => {
      ctx.console.handles[this.id] = this
      this.refresh()
    })
  }

  send(payload: any) {
    this.socket.send(JSON.stringify(payload))
  }

  async receive(data: any) {
    const { type, args, id } = JSON.parse(data.data.toString())
    const listener = this.ctx.console.listeners[type]
    if (!listener) {
      logger.info('unknown message:', type, ...args)
      return this.send({ type: 'response', body: { id, error: 'not implemented' } })
    }

    if (await this.ctx.serial('console/intercept', this, listener)) {
      return this.send({ type: 'response', body: { id, error: 'unauthorized' } })
    }

    try {
      const value = await listener.callback.call(this, ...args)
      return this.send({ type: 'response', body: { id, value } })
    } catch (e) {
      logger.debug(e)
      const error = coerce(e)
      return this.send({ type: 'response', body: { id, error } })
    }
  }

  refresh() {
    DataService.keys.forEach(async (key) => {
      const service = this.ctx[`console.${key}`] as DataService
      if (!service) return
      if (await this.ctx.serial('console/intercept', this, service.options)) {
        return this.send({ type: 'data', body: { key, value: null } })
      }

      try {
        const value = await service.get()
        if (!value) return
        this.send({ type: 'data', body: { key, value } })
      } catch (error) {
        this.ctx.logger('console').warn(error)
      }
    })
  }
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
  readonly entries: Dict<string[]> = Object.create(null)
  readonly listeners: Dict<Listener> = Object.create(null)
  readonly handles: Dict<SocketHandle> = Object.create(null)

  constructor(public ctx: Context) {
    super(ctx, 'console', true)
    ctx.plugin(EntryProvider)
  }

  async get() {
    return Object.values(this.entries).flat()
  }

  abstract resolveEntry(entry: string | string[] | Entry): string | string[]

  addEntry(entry: string | string[] | Entry) {
    const key = 'extension-' + Random.id()
    this.entries[key] = makeArray(this.resolveEntry(entry))
    this.entry.refresh()
    this.caller?.on('dispose', () => {
      delete this.entries[key]
      this.entry?.refresh()
    })
  }

  addListener<K extends keyof Events>(event: K, callback: Events[K], options?: DataService.Options) {
    this.listeners[event] = { callback, ...options }
  }

  broadcast(type: string, body: any, options: DataService.Options = {}) {
    const handles = Object.values(this.handles)
    if (!handles.length) return
    const data = JSON.stringify({ type, body })
    Promise.all(Object.values(this.handles).map(async (handle) => {
      if (await this.ctx.serial('console/intercept', handle, options)) return
      handle.socket.send(data)
    }))
  }
}

export interface Events {}

export namespace Console {
  export interface Services {
    entry: EntryProvider
  }
}

export default Console
