import { Context, Schema } from 'koishi'
import { PackageProvider } from './packages'
import { ConfigWriter, ServiceProvider } from '../shared'

export * from '../shared'

export const name = 'config'
export const inject = ['console', 'loader']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
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
