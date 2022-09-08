import { Context, Dict, Logger } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { AnalyzedPackage, MarketResult } from '@koishijs/registry'

declare module '@koishijs/plugin-console' {
  interface Events {
    'market/refresh'(): void
  }
}

const logger = new Logger('market')

export abstract class MarketProvider extends DataService<MarketProvider.Payload> {
  private _task: Promise<any>
  protected _error: any

  constructor(ctx: Context) {
    super(ctx, 'market', { authority: 4 })

    ctx.console.addListener('market/refresh', () => this.start(), { authority: 4 })
  }

  start() {
    this._task = null
    this.refresh()
  }

  abstract collect(): Promise<any>

  async prepare(): Promise<MarketResult> {
    return this._task ||= this.collect().catch((error) => {
      logger.warn(error)
      this._error = error
    })
  }
}

export namespace MarketProvider {
  export interface Payload {
    data: Dict<AnalyzedPackage>
    total: number
    failed: number
    progress: number
    gtavatar?: string
  }
}
