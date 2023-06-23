import { Context, pick } from 'koishi'
import * as shared from '../shared'

export class PackageProvider extends shared.PackageProvider {
  async getManifest(name: string) {
    return this.ctx.loader.market.objects.find(item => {
      return name === item.package.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    })?.manifest
  }

  async get(forced = false) {
    const packages = await Promise.all(this.ctx.loader.market.objects.map(async (data) => {
      const result = {
        ...pick(data, [
          'manifest',
          'peerDependencies',
          'peerDependenciesMeta',
        ]),
        ...pick(data.package, [
          'name',
          'version',
          'description',
          'portable',
        ]),
      } as shared.PackageProvider.Data
      result.shortname = result.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      if (!result.portable) return
      result.runtime = await this.parseExports(result.name, () => {
        return this.ctx.loader.resolvePlugin(result.shortname)
      })
      return result
    }))

    // add app config
    packages.unshift({
      name: '',
      shortname: '',
      runtime: {
        schema: Context.Config,
      },
    })

    return Object.fromEntries(packages.filter(x => x).map(data => [data.name, data]))
  }
}
