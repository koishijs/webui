import * as shared from '../shared'

export class PackageProvider extends shared.PackageProvider {
  import(name: string) {
    const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    return this.ctx.loader.resolvePlugin(shortname)
  }

  async collect(forced: boolean) {
    return this.ctx.loader.market.objects
  }
}
