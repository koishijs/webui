import { Context, Logger, pick, Schema } from 'koishi'
import { Registry } from '@koishijs/registry'
import { gt } from 'semver'
import { resolve } from 'path'
import Dependencies from './deps'
import Installer from './installer'
import MarketProvider from './market'

export * from '../shared'

export { Dependencies, Installer }

declare module 'koishi' {
  interface Context {
    installer: Installer
  }
}

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      dependencies: Dependencies
    }
  }
}

const logger = new Logger('market')

export const name = 'market'

export interface Config {
  registry?: Installer.Config
  search?: MarketProvider.Config
}

export const Config: Schema<Config> = Schema.object({
  registry: Installer.Config,
  search: MarketProvider.Config,
}).i18n({
  'zh-CN': require('./locales/schema.zh-CN'),
})

export function apply(ctx: Context, config: Config) {
  if (!ctx.loader.writable) {
    return ctx.logger('app').warn('@koishijs/plugin-market is only available for json/yaml config file')
  }

  ctx.i18n.define('zh', require('./locales/message.zh-CN'))

  ctx.plugin(Installer, config.registry)

  ctx.using(['installer'], (ctx) => {
    ctx.command('plugin.install [name]', { authority: 4 })
      .alias('.i')
      .action(async ({ session }, name) => {
        if (!name) return session.text('.expect-name')
        const deps = await ctx.installer.get()
        if (deps[name]) return session.text('.already-installed')
        let registry: Registry
        try {
          registry = await ctx.installer.getRegistry(name)
        } catch (error) {
          logger.warn(error)
          return session.text('.unknown-error')
        }
        ctx.envData.message = {
          ...pick(session, ['sid', 'channelId', 'guildId', 'subtype']),
          content: session.text('.success'),
        }
        await ctx.installer.install({ [name]: registry.version })
        ctx.envData.message = null
        return session.text('.success')
      })

    ctx.command('plugin.uninstall <name>', { authority: 4 })
      .alias('.r')
      .action(async ({ session }, name) => {
        if (!name) return session.text('.expect-name')
        const deps = await ctx.installer.get()
        if (!deps[name]) return session.text('.not-installed')
        ctx.envData.message = {
          ...pick(session, ['sid', 'channelId', 'guildId', 'subtype']),
          content: session.text('.success'),
        }
        await ctx.installer.install({ [name]: null })
        ctx.envData.message = null
        return session.text('.success')
      })

    ctx.command('plugin.upgrade', { authority: 4 })
      .alias('.update', '.up')
      .action(async ({ session }) => {
        const deps = await ctx.installer.get()
        const names = Object.keys(deps).filter((name) => {
          const { latest, resolved, invalid } = deps[name]
          try {
            return !invalid && gt(latest, resolved)
          } catch {}
        })
        if (!names.length) return session.text('.all-updated')
        const output = names.map((name) => {
          const { latest, resolved } = deps[name]
          return `${name}: ${resolved} -> ${latest}`
        })
        output.unshift(session.text('.available'))
        output.push(session.text('.prompt'))
        await session.send(output.join('\n'))
        const result = await session.prompt()
        if (!['Y', 'y'].includes(result?.trim())) {
          return session.text('.cancelled')
        }
        ctx.envData.message = {
          ...pick(session, ['sid', 'channelId', 'guildId', 'subtype']),
          content: session.text('.success'),
        }
        await ctx.installer.install(names.reduce((result, name) => {
          result[name] = deps[name].latest
          return result
        }, {}))
        ctx.envData.message = null
        return session.text('.success')
      })
  })

  ctx.using(['console', 'installer'], (ctx) => {
    ctx.plugin(Dependencies)
    ctx.plugin(MarketProvider, config.search)

    ctx.console.addEntry({
      dev: resolve(__dirname, '../../client/index.ts'),
      prod: resolve(__dirname, '../../dist'),
    })
  })
}
