import { Context, Dict, pick, Quester, Schema, Time, valueMap } from 'koishi'
import Scanner, { AnalyzedPackage, SearchResult } from '@koishijs/registry'
import { MarketProvider as BaseMarketProvider } from '../shared'
import { throttle } from 'throttle-debounce'

class MarketProvider extends BaseMarketProvider {
  static using = ['console.dependencies']

  private http: Quester
  private failed: string[] = []
  private scanner: Scanner
  private fullCache: Dict<AnalyzedPackage> = {}
  private tempCache: Dict<AnalyzedPackage> = {}

  constructor(ctx: Context, public config: MarketProvider.Config) {
    super(ctx)
    if (config.endpoint) this.http = ctx.http.extend(config)
  }

  async start() {
    super.start()
    this.failed = []
    this.fullCache = {}
    this.tempCache = {}
    this.ctx.console.dependencies.refresh()
    await this.prepare()
    this.refresh()
  }

  stop() {
    this.flushData.cancel()
  }

  flushData = throttle(500, () => {
    this.ctx.console.broadcast('market/patch', {
      data: this.tempCache,
      failed: this.failed.length,
      total: this.scanner.total,
      progress: this.scanner.progress,
    })
    this.tempCache = {}
  })

  async collect() {
    const { timeout } = this.config
    this.failed = []
    this.scanner = new Scanner(this.ctx.console.dependencies.http.get)
    if (this.http) {
      const result = await this.http.get<SearchResult>('')
      this.scanner.objects = result.objects.filter(object => !object.ignored)
      this.scanner.total = this.scanner.objects.length
    } else {
      await this.scanner.collect({ timeout })
    }

    this.scanner.analyze({
      version: '4',
      onFailure: (name) => {
        this.failed.push(name)
      },
      onSuccess: (item) => {
        const { name, versions } = item
        this.tempCache[name] = this.fullCache[name] = {
          ...item,
          versions: valueMap(versions, item => pick(item, ['peerDependencies'])),
        }
      },
      after: () => this.flushData(),
    })
    return null
  }

  async get() {
    await this.prepare()
    if (this._error) return { data: {}, failed: 0, total: 0, progress: 0 }
    return {
      data: this.fullCache,
      failed: this.failed.length,
      total: this.scanner.total,
      progress: this.scanner.progress,
      gravatar: process.env.GRAVATAR_MIRROR,
    }
  }
}

namespace MarketProvider {
  export interface Config {
    endpoint?: string
    timeout?: number
  }

  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().role('link').description('用于搜索插件市场的网址。默认跟随 registry 设置。'),
    timeout: Schema.number().role('time').default(Time.second * 30).description('搜索插件市场的超时时间。'),
    proxyAgent: Schema.string().role('link').description('用于搜索插件市场的代理。'),
  }).description('搜索设置')
}

export default MarketProvider
