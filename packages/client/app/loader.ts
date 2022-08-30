import type { AbstractWebSocket, SocketHandle } from '@koishijs/plugin-console'
import type { Context } from 'koishi'

declare global {
  const KOISHI_MODULES: string
}

class StubWebSocket implements AbstractWebSocket {
  remote: StubWebSocket
  onopen(event: any) {}
  onmessage(event: any) {}
  onclose(event: any) {}
  onerror(event: any) {}
  send(data: string) {
    this.remote.onmessage(data)
  }
}

class BackWebSocket extends StubWebSocket {
  app: Context
  handle: SocketHandle

  constructor(public remote: StubWebSocket) {
    super()
    this.start()
  }

  private async start() {
    const [koishi, console] = await Promise.all([
      import(/* @vite-ignore */ KOISHI_MODULES + '/koishi/index.js'),
      import(/* @vite-ignore */ KOISHI_MODULES + '/@koishijs/plugin-console/index.js'),
    ]) as [
      typeof import('koishi'),
      typeof import('@koishijs/plugin-console'),
    ]

    this.app = new koishi.Context()
    this.app.plugin(console.default)
    this.handle = new console.SocketHandle(this.app, this)
  }

  send(data: string) {
    this.remote.onmessage(data)
  }
}

export default class FrontWebSocket extends StubWebSocket {
  remote = new BackWebSocket(this)

  constructor() {
    super()
    this.onopen(null)
  }
}
