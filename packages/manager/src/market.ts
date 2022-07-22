import { Context, Dict, pick, Quester, Schema, Time } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import Scanner, { AnalyzedPackage, PackageJson } from '@koishijs/registry'
import which from 'which-pm-runs'
import spawn from 'cross-spawn'

class MarketProvider extends DataService<Dict<MarketProvider.Data>> {
  /** https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md */
  public http: Quester

  private timestamp = 0
  private fullCache: Dict<MarketProvider.Data> = {}
  private tempCache: Dict<MarketProvider.Data> = {}
  private initTask: Promise<string>

  constructor(ctx: Context, public config: MarketProvider.Config) {
    super(ctx, 'market', { authority: 4 })
  }

  async start() {
    const logger = this.ctx.logger('market')
    await this.prepare().catch(logger.warn)
    this.refresh()
  }

  flushData() {
    const now = Date.now()
    if (now - this.timestamp < 100) return
    this.timestamp = now
    this.patch(this.tempCache)
    this.tempCache = {}
  }

  private async _initialize() {
    const cwd = this.ctx.app.baseDir
    const registry = await new Promise<string>((resolve, reject) => {
      let stdout = ''
      const agent = which()
      const key = (agent?.name === 'yarn' && !agent?.version.startsWith('1.')) ? 'npmRegistryServer' : 'registry'
      const child = spawn(agent?.name || 'npm', ['config', 'get', key], { cwd })
      child.on('exit', (code) => {
        if (!code) return resolve(stdout)
        reject(new Error(`child process failed with code ${code}`))
      })
      child.on('error', reject)
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
    })

    const endpoint = registry.trim()
    this.http = this.ctx.http.extend({ endpoint })
    return endpoint
  }

  initialize() {
    return this.initTask ||= this._initialize()
  }

  async prepare() {
    await this.initialize()

    const { searchUrl, searchTimeout } = this.config
    const scanner = new Scanner(this.http.get)
    if (searchUrl) {
      const result = await this.ctx.http.get(searchUrl, { timeout: searchTimeout })
      scanner.objects = result.objects
    } else {
      await scanner.collect({ timeout: searchTimeout })
    }

    await scanner.analyze({
      version: '4',
      onSuccess: (item) => {
        const { name, versions } = item
        this.tempCache[name] = this.fullCache[name] = {
          ...item,
          versions: versions.map(item => pick(item, ['version', 'keywords', 'peerDependencies'])),
        }
        this.flushData()
      },
    })
  }

  async get() {
    return this.fullCache
  }
}

namespace MarketProvider {
  export interface Config {
    searchUrl?: string
    searchTimeout?: number
  }

  export const Config: Schema<Config> = Schema.object({
    searchUrl: Schema.string().description('用于搜索插件市场的网址。默认跟随你当前的 npm registry。'),
    searchTimeout: Schema.number().role('time').default(Time.second * 30).description('搜索插件市场的超时时间。'),
  }).description('搜索设置')

  export interface Data extends Omit<AnalyzedPackage, 'versions'> {
    versions: Partial<PackageJson>[]
  }
}

export default MarketProvider
