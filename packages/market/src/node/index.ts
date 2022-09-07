import { Context, Schema } from 'koishi'
import { resolve } from 'path'
import Installer from './installer'
import MarketProvider from './market'
import PackageProvider from './packages'
import { ConfigWriter } from '../shared'

export * from './market'
export * from './packages'
export * from '../shared'

export {
  Installer,
  MarketProvider,
  PackageProvider,
}

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      dependencies: Installer
      market: MarketProvider
      packages: PackageProvider
      config: ConfigWriter
    }
  }
}

export const name = 'manager'
export const using = ['console', 'loader'] as const

export interface Config {
  registry?: Installer.Config
  search?: MarketProvider.Config
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    registry: Installer.Config,
    search: MarketProvider.Config,
  }),
])

export function apply(ctx: Context, config: Config) {
  if (!ctx.loader.writable) {
    return ctx.logger('manager').warn('manager is only available for json/yaml config file')
  }

  ctx.plugin(Installer, config.registry)
  ctx.plugin(MarketProvider, config.search)
  ctx.plugin(PackageProvider)
  ctx.plugin(ConfigWriter)

  ctx.console.addEntry({
    dev: resolve(__dirname, '../../client/index.ts'),
    prod: resolve(__dirname, '../../dist'),
  })
}
