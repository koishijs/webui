import type { AbstractWebSocket } from '@koishijs/plugin-console'
import type { Context } from 'koishi'
import { root } from '@koishijs/client'
import { activate, data, getLoader } from './utils'
import Instances from './index.vue'

class StubWebSocket implements AbstractWebSocket {
  remote: StubWebSocket
  onopen(event: any) {}
  onmessage(event: any) {}
  onclose(event: any) {}
  onerror(event: any) {}
  send(data: string) {
    this.remote.onmessage({ data })
  }
}

class BackWebSocket extends StubWebSocket {
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

export default class FrontWebSocket extends StubWebSocket {
  remote = new BackWebSocket(this)

  constructor() {
    super()
    this.onopen({})

    root.slot({
      type: 'home',
      order: 900,
      component: Instances,
    })
  }
}
