import type { AbstractWebSocket } from '@koishijs/plugin-console'
import type { Context } from 'koishi'
import { Dict, root } from '@koishijs/client'
import { activate, data, getLoader } from './utils'
import Instances from './index.vue'

class StubWebSocket implements AbstractWebSocket {
  remote: StubWebSocket
  listeners: Dict<Set<AbstractWebSocket.EventListener>> = {}

  addEventListener(type: any, listener: (event: any) => void) {
    (this.listeners[type] ||= new Set()).add(listener)
  }

  removeEventListener(type: any, listener: (event: any) => void) {
    this.listeners[type]?.delete(listener)
  }

  dispatchEvent(event: AbstractWebSocket.Event) {
    this.listeners[event.type]?.forEach(fn => fn(event))
    return true
  }

  send(data: string) {
    this.remote.dispatchEvent({ type: 'message', target: this, data } as AbstractWebSocket.MessageEvent)
  }
}

class ServerWebSocket extends StubWebSocket {
  app: Context

  constructor(public remote: StubWebSocket) {
    super()
    this.start()
  }

  private async start() {
    const loader = await getLoader()
    loader[Symbol.for('koishi.socket')] = this
    await activate(data.value.current)
  }
}

export default class ClientWebSocket extends StubWebSocket {
  remote = new ServerWebSocket(this)

  constructor() {
    super()
    setTimeout(() => this.dispatchEvent({ type: 'open', target: this }), 0)
    root.slot({
      type: 'home',
      order: 900,
      component: Instances,
    })
  }
}
