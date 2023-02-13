import { MarketProvider as BaseMarketProvider } from '../shared'

export default class MarketProvider extends BaseMarketProvider {
  start() {
    super.start()
    this.refresh()
  }

  async collect() {
    const response = await fetch('https://registry.koishi.chat/play.json')
    return await response.json()
  }

  async get() {
    const market = await this.prepare()
    if (!market) return { data: {}, failed: 0, total: 0, progress: 0 }
    return {
      data: Object.fromEntries(market.objects.map(item => [item.name, item])),
      failed: 0,
      total: market.objects.length,
      progress: market.objects.length,
    }
  }
}
