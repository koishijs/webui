import { Context } from 'koishi'
import { Console, Entry, SocketHandle } from '../shared'

export * from '../shared'

class BrowserConsole extends Console {
  constructor(public ctx: Context) {
    super(ctx)
    // eslint-disable-next-line no-new
    new SocketHandle(ctx, ctx[Symbol.for('koishi.socket')])
  }

  resolveEntry(entry: string | string[] | Entry) {
    if (typeof entry === 'string' || Array.isArray(entry)) return entry
    return entry.prod
  }
}

export default BrowserConsole
