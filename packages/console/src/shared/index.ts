import { Awaitable, coerce, Context, Dict, Logger, Random, Service } from 'koishi'
import { DataService } from './service'
import NodeConsole from '../node'

export * from './service'

export interface AbstractWebSocket {
  onopen(event: any): void
  onerror(event: any): void
  onmessage(event: any): void
  onclose(event: any): void
  send(data: string): void
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
    this.refresh()
    ctx.console.handles[this.id] = this
    socket.onmessage = this.receive.bind(this)
  }

  send(payload: any) {
    this.socket.send(JSON.stringify(payload))
  }

  async receive(data: any) {
    const { type, args, id } = JSON.parse(data.toString())
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
  prod: string
}

export abstract class Console extends Service {
  readonly listeners: Dict<Listener> = {}
  readonly handles: Dict<SocketHandle> = {}

  constructor(public ctx: Context) {
    super(ctx, 'console', true)
  }

  abstract addEntry(entry: string | Entry): void

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
  export interface Services {}
}

export default Console
