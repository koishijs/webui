import { Schema } from 'koishi'
import { Console, Entry, SocketHandle } from '../shared'
import {} from '@koishijs/loader'

export * from '../shared'

class BrowserConsole extends Console {
  start() {
    // eslint-disable-next-line no-new
    new SocketHandle(this.ctx, this.ctx.loader[Symbol.for('koishi.socket')])
  }

  resolveEntry(entry: string | string[] | Entry) {
    if (typeof entry === 'string' || Array.isArray(entry)) return entry
    return entry.prod
  }
}

namespace BrowserConsole {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default BrowserConsole
