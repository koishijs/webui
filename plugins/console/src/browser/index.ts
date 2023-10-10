import { makeArray, Schema } from 'koishi'
import { Console, Entry } from '@koishijs/console'
import {} from '@koishijs/loader'

export * from '@koishijs/console'

class BrowserConsole extends Console {
  start() {
    this.accept(this.ctx.loader[Symbol.for('koishi.socket')])
  }

  resolveEntry(entry: string | string[] | Entry) {
    if (typeof entry === 'string' || Array.isArray(entry)) return makeArray(entry)
    return makeArray(entry.prod)
  }
}

namespace BrowserConsole {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default BrowserConsole
