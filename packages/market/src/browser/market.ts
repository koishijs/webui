import { MarketProvider as BaseMarketProvider } from '../shared'

export default class MarketProvider extends BaseMarketProvider {
  async collect() {
    const response = await fetch('https://registry.koishi.chat/market.json')
    return await response.json()
  }

  async get() {
    console.log(1)
    const market = await this.prepare()
    console.log(12, market)
    if (!market) return { data: {}, failed: 0, total: 0, progress: 0 }
    console.log(123)
    return {
      data: Object.fromEntries(market.objects.map(item => [item.name, item])),
      failed: 0,
      total: market.objects.length,
      progress: market.objects.length,
    }
  }
}
