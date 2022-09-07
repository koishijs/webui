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
    const tasks: [
      Promise<typeof import('@koishijs/loader')>,
      Promise<typeof import('koishi')>,
    ] = [
      import(/* @vite-ignore */ config.endpoint + '/modules/@koishijs/loader/index.js'),
      import(/* @vite-ignore */ config.endpoint + '/modules/koishi/index.js'),
    ]
    const [{ default: Loader }, { Context }] = await Promise.all(tasks)
    Context.service('console')
    const loader = new Loader(config.endpoint)
    loader.config.plugins = {
      'console': {},
      'echo': {},
      'insight': {},
      'help': {},
      'sandbox': {},
      'market': {},
      'suggest': {},
      // 'repeater': {},
      // 'hangman': {},
    }
    this.app = await loader.createApp()
    this.app[Symbol.for('koishi.socket')] = this
    await this.app.start()
  }
}

export default class FrontWebSocket extends StubWebSocket {
  remote = new BackWebSocket(this)

  constructor() {
    super()
    this.onopen({})
  }
}
