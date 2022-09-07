import { Context, Dict, pick, Runtime, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { Manifest, MarketResult, PackageJson } from '@koishijs/registry'
import { unwrapExports } from '@koishijs/loader'

class PackageProvider extends DataService<Dict<PackageProvider.Data>> {
  protected _task: Promise<MarketResult>

  constructor(ctx: Context, config: PackageProvider.Config) {
    super(ctx, 'packages', { authority: 4 })

    ctx.on('internal/runtime', (runtime) => {
      this.refresh()
    })

    ctx.on('internal/fork', (fork) => {
      this.refresh()
    })
  }

  async _prepare(): Promise<MarketResult> {
    const response = await fetch('https://registry.koishi.chat/market.json')
    return await response.json()
  }

  async prepare() {
    return this._task ||= this._prepare()
  }

  async getManifest(name: string) {
    const market = await this.prepare()
    return market.objects.find(item => {
      return name === item.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    })?.manifest
  }

  async get(forced = false) {
    const market = await this.prepare()

    const packages = await Promise.all(market.objects.map(async (data) => {
      const result = pick(data, [
        'name',
        'version',
        'description',
        'portable',
        'manifest',
      ]) as PackageProvider.Data
      result.shortname = data.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      result.manifest = data.manifest
      result.peerDependencies = { ...data.versions[data.version].peerDependencies }
      if (!result.portable) return
      const exports = unwrapExports(await import(/* @vite-ignore */ `https://registry.koishi.chat/modules/${data.name}/index.js`))
      result.schema = exports?.Config || exports?.schema
      const runtime = this.ctx.registry.get(exports)
      if (runtime) this.parseRuntime(runtime, result)
      return result
    }))

    // add app config
    packages.unshift({
      name: '',
      shortname: '',
      schema: Context.Config,
    })

    return Object.fromEntries(packages.filter(x => x).map(data => [data.name, data]))
  }

  parseRuntime(runtime: Runtime, result: PackageProvider.Data) {
    result.id = runtime.uid
    result.forkable = runtime.isForkable
  }
}

namespace PackageProvider {
  export interface Config {}

  export interface Data extends Partial<PackageJson> {
    id?: number
    portable?: boolean
    forkable?: boolean
    shortname?: string
    schema?: Schema
    workspace?: boolean
    manifest?: Manifest
  }
}

export default PackageProvider
