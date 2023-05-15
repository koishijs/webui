import { Context, pick } from 'koishi'
import { MarketResult } from '@koishijs/registry'
import * as shared from '../shared'

declare module '@koishijs/loader' {
  interface Loader {
    market: MarketResult
  }
}

export class PackageProvider extends shared.PackageProvider {
  async getManifest(name: string) {
    return this.ctx.loader.market.objects.find(item => {
      return name === item.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    })?.manifest
  }

  async get(forced = false) {
    const packages = await Promise.all(this.ctx.loader.market.objects.map(async (data) => {
      const result = pick(data, [
        'name',
        'version',
        'description',
        'portable',
        'manifest',
      ]) as shared.PackageProvider.Data
      result.shortname = data.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      result.manifest = data.manifest
      result.peerDependencies = { ...data.versions[data.version].peerDependencies }
      result.peerDependenciesMeta = { ...data.versions[data.version].peerDependenciesMeta }
      if (!result.portable) return
      const exports = await this.ctx.loader.resolvePlugin(data.shortname)
      result.schema = exports?.Config || exports?.schema
      result.usage = exports?.usage
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
}
