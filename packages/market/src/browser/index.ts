import { Context, Schema } from 'koishi'
import MarketProvider from './market'
import PackageProvider from './packages'
import { ConfigWriter } from '../shared'

export * from './market'
export * from './packages'
export * from '../shared'

export {
  MarketProvider,
  PackageProvider,
}

export const name = 'manager'
export const using = ['console'] as const

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(MarketProvider)
  ctx.plugin(PackageProvider)
  ctx.plugin(ConfigWriter)

  ctx.console.addEntry(process.env.KOISHI_BASE ? [
    process.env.KOISHI_BASE + '/dist/index.js',
    process.env.KOISHI_BASE + '/dist/style.css',
  ] : [
    // @ts-ignore
    import.meta.url.replace(/\/lib\/[^/]+\/[^/]+$/, '/client/index.ts'),
  ])
}
