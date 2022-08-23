import { Context } from 'koishi'
import { Console, Entry } from '../shared'

export * from '../shared'

class BrowserConsole extends Console {
  constructor(public ctx: Context) {
    super(ctx)
  }

  addEntry(entry: string | Entry) {
    if (typeof entry !== 'string') entry = entry.prod
    this.http.addEntry(entry)
  }
}

export default BrowserConsole
