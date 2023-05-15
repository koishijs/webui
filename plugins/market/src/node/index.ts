import { Context, Schema } from 'koishi'
import { resolve } from 'path'
import Installer from './installer'
import MarketProvider from './market'

export * from '../shared'

export { Installer }

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      dependencies: Installer
    }
  }
}

export const filter = false
export const name = 'market'
export const using = ['console', 'loader'] as const

export interface Config {
  registry?: Installer.Config
  search?: MarketProvider.Config
}

export const Config: Schema<Config> = Schema.object({
  registry: Installer.Config,
  search: MarketProvider.Config,
})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(Installer, config.registry)
  ctx.plugin(MarketProvider, config.search)

  ctx.console.addEntry({
    dev: resolve(__dirname, '../../client/index.ts'),
    prod: resolve(__dirname, '../../dist'),
  })
}
