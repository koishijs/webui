import { Context, Dict } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { AnalyzedPackage, MarketResult } from '@koishijs/registry'

declare module '@koishijs/registry' {
  interface User {
    avatar?: string
  }
}

class MarketProvider extends DataService<MarketProvider.Payload> {
  constructor(ctx: Context) {
    super(ctx, 'market', { authority: 4 })
  }

  async get() {
    const response = await fetch('https://registry.koishi.chat/market.json')
    const market: MarketResult = await response.json()
    return {
      data: Object.fromEntries(market.objects.map(item => [item.name, item])),
      failed: 0,
      total: market.objects.length,
      progress: market.objects.length,
    }
  }
}

namespace MarketProvider {
  export interface Payload {
    data: Dict<AnalyzedPackage>
    total: number
    progress: number
  }
}

export default MarketProvider
