import { Awaitable, Context, Dict, Logger, Time } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { SearchObject, SearchResult } from '@koishijs/registry'

declare module '@koishijs/plugin-console' {
  interface Events {
    'market/refresh'(): void
  }

  namespace Console {
    interface Services {
      market: MarketProvider
    }
  }
}

const logger = new Logger('market')

export abstract class MarketProvider extends DataService<MarketProvider.Payload> {
  private _task: Promise<any>
  private _timestamp = 0
  protected _error: any

  constructor(ctx: Context) {
    super(ctx, 'market', { authority: 4 })

    ctx.console.addListener('market/refresh', () => this.start(true), { authority: 4 })

    ctx.on('console/connection', async (client) => {
      if (!ctx.console.clients[client.id]) return
      if (Date.now() - this._timestamp <= Time.hour * 12) return
      if (await this.ctx.serial('console/intercept', client, { authority: 4 })) return
      this.start()
    })
  }

  start(refresh = false): Awaitable<void> {
    this._task = null
    this._timestamp = Date.now()
    this.refresh()
  }

  abstract collect(): Promise<void | SearchResult>

  async prepare(): Promise<SearchResult> {
    return this._task ||= this.collect().catch((error) => {
      logger.warn(error)
      this._error = error
    })
  }
}

export namespace MarketProvider {
  export interface Payload {
    data: Dict<SearchObject>
    total: number
    failed: number
    progress: number
    gravatar?: string
  }
}
