import { Context, Schema } from 'koishi'
import Installer from './installer'
import MarketProvider from './market'
import PackageProvider from './packages'
import { ConfigWriter, ServiceProvider } from '../shared'

export * from './installer'
export * from './market'
export * from './packages'
export * from '../shared'

export {
  Installer,
  MarketProvider,
  PackageProvider,
}

export const name = 'manager'
export const using = ['console'] as const

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(Installer)
  ctx.plugin(MarketProvider)
  ctx.plugin(PackageProvider)
  ctx.plugin(ConfigWriter)
  ctx.plugin(ServiceProvider)

  ctx.console.addEntry(process.env.KOISHI_BASE ? [
    process.env.KOISHI_BASE + '/dist/index.js',
    process.env.KOISHI_BASE + '/dist/style.css',
  ] : [
    // @ts-ignore
    import.meta.url.replace(/\/src\/[^/]+\/[^/]+$/, '/client/index.ts'),
  ])
}
