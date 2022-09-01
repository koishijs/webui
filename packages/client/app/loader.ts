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

const plugins = {
  '@koishijs/plugin-console': {},
  '@koishijs/plugin-echo': {},
  '@koishijs/plugin-dataview': {},
  '@koishijs/plugin-insight': {},
  '@koishijs/plugin-help': {},
  '@koishijs/plugin-sandbox': {},
  '@koishijs/plugin-suggest': {},
  '@koishijs/plugin-repeater': {},
  'koishi-plugin-hangman': {},
}

function unwrap(module: any) {
  return module?.default || module
}

class BackWebSocket extends StubWebSocket {
  app: Context

  constructor(public remote: StubWebSocket) {
    super()
    this.start()
  }

  private async start() {
    const tasks = [import(/* @vite-ignore */ config.endpoint + '/koishi/index.js')]
    for (const key in plugins) {
      tasks.push(import(/* @vite-ignore */ config.endpoint + '/' + key + '/index.js').then(value => [key, value]))
    }
    const [{ Context }, ...entries] = await Promise.all(tasks)
    Context.service('console')
    this.app = new Context()
    this.app[Symbol.for('koishi.socket')] = this
    for (const [key, exports] of entries) {
      this.app.plugin(unwrap(exports), plugins[key])
    }
  }
}

export default class FrontWebSocket extends StubWebSocket {
  remote = new BackWebSocket(this)

  constructor() {
    super()
    this.onopen({})
  }
}
