import { Context, Schema } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/console'
import MetaProvider from './meta'
import StatisticsProvider from './stats'

export type Activity = Record<number, number>

declare module 'koishi' {
  interface Channel {
    name: string
    activity: Activity
  }
}

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      meta: MetaProvider
      stats: StatisticsProvider
    }
  }
}

export {
  MetaProvider,
  StatisticsProvider,
}

export * from './meta'
export * from './stats'

export const filter = false
export const name = 'status'
export const inject = ['console'] as const

export interface Config extends MetaProvider.Config, StatisticsProvider.Config {}

export const Config: Schema<Config> = Schema.intersect([
  MetaProvider.Config,
  StatisticsProvider.Config,
])

export function apply(ctx: Context, config: Config) {
  ctx.console.addEntry({
    dev: resolve(__dirname, '../client/index.ts'),
    prod: resolve(__dirname, '../dist'),
  })

  ctx.plugin(MetaProvider, config)
  ctx.plugin(StatisticsProvider, config)
}
