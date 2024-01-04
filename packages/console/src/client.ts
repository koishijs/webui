import { coerce, Context, Logger, Random, Universal } from 'koishi'
import { DataService } from './service'
import { IncomingMessage } from 'http'

const logger = new Logger('console')

export class Client {
  readonly id: string = Random.id()

  constructor(readonly ctx: Context, public socket: Universal.WebSocket, public request?: IncomingMessage) {
    socket.addEventListener('message', this.receive)
    ctx.on('dispose', () => {
      socket.removeEventListener('message', this.receive)
    })
    this.refresh()
  }

  send(payload: any) {
    this.socket.send(JSON.stringify(payload))
  }

  receive = async (data: Universal.WebSocket.MessageEvent) => {
    const { type, args, id } = JSON.parse(data.data.toString())
    const listener = this.ctx.get('console').listeners[type]
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
    Object.keys(this.ctx.root[Context.internal]).forEach(async (name) => {
      if (!name.startsWith('console.')) return
      const key = name.slice(8)
      const service = this.ctx.get(name) as DataService
      if (!service) return
      if (await this.ctx.serial('console/intercept', this, service.options)) {
        return this.send({ type: 'data', body: { key, value: null } })
      }

      try {
        const value = await service.get(false, this)
        if (!value) return
        this.send({ type: 'data', body: { key, value } })
      } catch (error) {
        logger.warn(error)
      }
    })
  }
}
