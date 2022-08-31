import type { AbstractWebSocket } from '@koishijs/plugin-console'
import type { Context } from 'koishi'
import { config } from '@koishijs/client'

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
    const [koishi, console, help, dataview, sandbox] = await Promise.all([
      import(/* @vite-ignore */ config.endpoint + '/koishi/index.js'),
      import(/* @vite-ignore */ config.endpoint + '/@koishijs/plugin-console/index.js'),
      import(/* @vite-ignore */ config.endpoint + '/@koishijs/plugin-help/index.js'),
      import(/* @vite-ignore */ config.endpoint + '/@koishijs/plugin-dataview/index.js'),
      import(/* @vite-ignore */ config.endpoint + '/@koishijs/plugin-sandbox/index.js'),
    ]) as [
      typeof import('koishi'),
      typeof import('@koishijs/plugin-console'),
      typeof import('@koishijs/plugin-help'),
      typeof import('@koishijs/plugin-dataview'),
      typeof import('@koishijs/plugin-sandbox'),
    ]

    koishi.Context.service('console')
    this.app = new koishi.Context()
    this.app.plugin(console.default)
    this.app.plugin(help)
    this.app.plugin(dataview.default)
    this.app.plugin(sandbox.default)

    this.app.start().then(() => {
      // eslint-disable-next-line no-new
      new console.SocketHandle(this.app, this)
    })
  }
}

export default class FrontWebSocket extends StubWebSocket {
  remote = new BackWebSocket(this)

  constructor() {
    super()
    this.onopen({})
  }
}
