import { Context, Dict, pick, Runtime, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { Manifest, MarketResult, PackageJson } from '@koishijs/registry'

function unwrap(module: any) {
  return module?.default || module
}

class PackageProvider extends DataService<Dict<PackageProvider.Data>> {
  constructor(ctx: Context, config: PackageProvider.Config) {
    super(ctx, 'packages', { authority: 4 })

    ctx.on('internal/runtime', (runtime) => {
      this.refresh()
    })

    ctx.on('internal/fork', (fork) => {
      this.refresh()
    })
  }

  async get(forced = false) {
    const response = await fetch('https://registry.koishi.chat/market.json')
    const market: MarketResult = await response.json()

    const packages = await Promise.all(market.objects.map(async (data) => {
      const result = pick(data, [
        'name',
        'version',
        'description',
      ]) as PackageProvider.Data
      result.shortname = data.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      result.manifest = data.manifest
      result.peerDependencies = { ...data.versions[data.version].peerDependencies }
      if (!result['hasBundle']) return
      const exports = unwrap(await import(/* @vite-ignore */ `https://registry.koishi.chat/modules/${data.name}/index.js`))
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
    forkable?: boolean
    shortname?: string
    schema?: Schema
    workspace?: boolean
    manifest?: Manifest
  }
}

export default PackageProvider
