import { Context, Dict, Logger, pick, Schema, Time, valueMap } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import Scanner, { AnalyzedPackage, SearchResult } from '@koishijs/registry'
import { createHash } from 'crypto'

declare module '@koishijs/registry' {
  interface User {
    avatar?: string
  }
}

const logger = new Logger('market')

class MarketProvider extends DataService<MarketProvider.Payload> {
  static using = ['console.dependencies']

  private timestamp = 0
  private failed: string[] = []
  private scanner: Scanner
  private fullCache: Dict<AnalyzedPackage> = {}
  private tempCache: Dict<AnalyzedPackage> = {}

  constructor(ctx: Context, public config: MarketProvider.Config) {
    super(ctx, 'market', { authority: 4 })
  }

  async start() {
    await this.prepare().catch((e) => {
      logger.warn(e)
      this.scanner.total = -1
      this.scanner.progress = -1
    })
    this.refresh()
  }

  flushData() {
    const now = Date.now()
    if (now - this.timestamp < 100) return
    this.timestamp = now
    this.ctx.console.broadcast('market/patch', {
      data: this.tempCache,
      failed: this.failed.length,
      total: this.scanner.total,
      progress: this.scanner.progress,
    })
    this.tempCache = {}
  }

  async prepare() {
    const { endpoint, timeout } = this.config
    const scanner = new Scanner(this.ctx.console.dependencies.http.get)
    if (endpoint) {
      const result = await this.ctx.http.get<SearchResult>(endpoint, { timeout })
      scanner.objects = result.objects.filter(object => !object.ignored)
      scanner.total = scanner.objects.length
    } else {
      await scanner.collect({ timeout })
    }

    this.failed = []
    this.scanner = scanner
    const mirror = process.env.GRAVATAR_MIRROR || 'https://s.gravatar.com'
    await scanner.analyze({
      version: '4',
      onFailure: (name) => {
        this.failed.push(name)
      },
      onSuccess: (item) => {
        const { name, versions, maintainers } = item
        for (const user of maintainers) {
          user.avatar = mirror + '/avatar/' + createHash('md5').update(user.email).digest('hex') + '?d=mp'
        }
        this.tempCache[name] = this.fullCache[name] = {
          ...item,
          versions: valueMap(versions, item => pick(item, ['peerDependencies'] as any)),
        }
      },
      after: () => this.flushData(),
    })
  }

  async get() {
    return {
      data: this.fullCache,
      failed: this.failed.length,
      total: this.scanner?.total || 0,
      progress: this.scanner?.progress || -1,
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
  }).description('搜索设置')

  export interface Payload {
    data: Dict<AnalyzedPackage>
    total: number
    progress: number
  }
}

export default MarketProvider
