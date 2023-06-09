import { Context, Schema } from 'koishi'
import Dependencies from './deps'
import MarketProvider from './market'

export * from './deps'
export * from './market'
export * from '../shared'

export {
  Dependencies,
  MarketProvider,
}

export const filter = false
export const name = 'market'
export const using = ['console'] as const

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(Dependencies)
  ctx.plugin(MarketProvider)

  ctx.console.addEntry(process.env.KOISHI_BASE ? [
    process.env.KOISHI_BASE + '/dist/index.js',
    process.env.KOISHI_BASE + '/dist/style.css',
  ] : [
    // @ts-ignore
    import.meta.url.replace(/\/src\/[^/]+\/[^/]+$/, '/client/index.ts'),
  ])
}
