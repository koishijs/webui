import { Context } from 'koishi'
import { Console, Entry } from '../shared'

export * from '../shared'

class BrowserConsole extends Console {
  constructor(public ctx: Context) {
    super(ctx)
  }

  resolveEntry(entry: string | string[] | Entry) {
    if (typeof entry === 'string' || Array.isArray(entry)) return entry
    return entry.prod
  }
}

export default BrowserConsole
