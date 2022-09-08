import { Context, pick } from 'koishi'
import { unwrapExports } from '@koishijs/loader'
import { PackageProvider as BasePackageProvider } from '../shared'

export default class PackageProvider extends BasePackageProvider {
  static using = ['console.market']

  async getManifest(name: string) {
    const market = await this.ctx.console.market.prepare()
    return market.objects.find(item => {
      return name === item.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    })?.manifest
  }

  async get(forced = false) {
    const market = await this.ctx.console.market.prepare()

    const packages = await Promise.all(market.objects.map(async (data) => {
      const result = pick(data, [
        'name',
        'version',
        'description',
        'portable',
        'manifest',
      ]) as BasePackageProvider.Data
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
}
