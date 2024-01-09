import { Context, Dict, Quester, Schema, Time } from 'koishi'
import Scanner, { SearchObject, SearchResult } from '@koishijs/registry'
import { MarketProvider as BaseMarketProvider } from '../shared'

class MarketProvider extends BaseMarketProvider {
  private http: Quester
  private failed: string[] = []
  private scanner: Scanner
  private fullCache: Dict<SearchObject> = {}
  private tempCache: Dict<SearchObject> = {}
  private flushData: () => void

  constructor(ctx: Context, public config: MarketProvider.Config) {
    super(ctx)
    if (config.endpoint) this.http = ctx.http.extend(config)
    this.flushData = ctx.throttle(() => {
      ctx.console.broadcast('market/patch', {
        data: this.tempCache,
        failed: this.failed.length,
        total: this.scanner.total,
        progress: this.scanner.progress,
      })
      this.tempCache = {}
    }, 500)
  }

  async start(refresh = false) {
    this.failed = []
    this.fullCache = {}
    this.tempCache = {}
    if (refresh) this.ctx.installer.refresh(true)
    await this.prepare()
    super.start()
  }

  async collect() {
    const { timeout } = this.config
    const registry = this.ctx.installer.http

    this.failed = []
    this.scanner = new Scanner(registry.get)
    if (this.http) {
      const result = await this.http.get<SearchResult>('')
      this.scanner.objects = result.objects.filter(object => !object.ignored)
      this.scanner.total = this.scanner.objects.length
      this.scanner.version = result.version
    } else {
      await this.scanner.collect({ timeout })
    }

    if (!this.scanner.version) {
      this.scanner.analyze({
        version: '4',
        onFailure: (name, reason) => {
          this.failed.push(name)
          if (registry.config.endpoint.startsWith('https://registry.npmmirror.com')) {
            if (Quester.isAxiosError(reason) && reason.response?.status === 404) {
              // ignore 404 error for npmmirror
            }
          }
        },
        onRegistry: (registry, versions) => {
          this.ctx.installer.setPackage(registry.name, versions)
        },
        onSuccess: (object, versions) => {
          this.fullCache[object.package.name] = this.tempCache[object.package.name] = object
        },
        after: () => this.flushData(),
      })
    }

    return null
  }

  async get() {
    await this.prepare()
    if (this._error) return { data: {}, failed: 0, total: 0, progress: 0 }
    return this.scanner.version ? {
      registry: this.ctx.installer.endpoint,
      data: Object.fromEntries(this.scanner.objects.map(item => [item.package.name, item])),
      failed: 0,
      total: this.scanner.total,
      progress: this.scanner.total,
      gravatar: process.env.GRAVATAR_MIRROR,
    } : {
      registry: this.ctx.installer.endpoint,
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
    endpoint: Schema.string().role('link'),
    timeout: Schema.number().role('time').default(Time.second * 30),
    proxyAgent: Schema.string().role('link'),
  })
}

export default MarketProvider
