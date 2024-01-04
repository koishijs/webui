import { Context } from 'koishi'
import { Client } from '.'

export namespace Entry {
  export type Files = string | string[] | EntryOptions

  export interface EntryOptions {
    dev: string
    prod: string | string[]
  }
}

export class Entry<T = any> {
  public id = Math.random().toString(36).slice(2)
  public dispose: () => void

  constructor(public ctx: Context, public files: Entry.Files, public data: (client: Client) => T) {
    ctx.console.entries[this.id] = this
    ctx.console.refresh('entry')
    this.dispose = ctx.collect('entry', () => {
      delete this.ctx.console.entries[this.id]
      ctx.console.refresh('entry')
    })
  }

  refresh() {
    this.ctx.console.broadcast('entry-data', async (client: Client) => ({
      id: this.id,
      data: await this.data(client),
    }))
  }
}
