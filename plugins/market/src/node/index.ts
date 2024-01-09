import { Context, Dict, pick, Schema } from 'koishi'
import { DependencyMetaKey, RemotePackage } from '@koishijs/registry'
import { gt } from 'semver'
import { resolve } from 'path'
import { DependencyProvider, RegistryProvider } from './deps'
import Installer from './installer'
import MarketProvider from './market'

export * from '../shared'

export { Installer }

declare module 'koishi' {
  interface Context {
    installer: Installer
  }
}

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      dependencies: DependencyProvider
      registry: RegistryProvider
    }
  }

  interface Events {
    'market/install'(deps: Dict<string>, forced?: boolean): Promise<number>
    'market/registry'(name: string): Promise<Dict<Pick<RemotePackage, DependencyMetaKey>>>
  }
}

export const name = 'market'
export const inject = ['http']

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
  if (!ctx.loader?.writable) {
    return ctx.logger('app').warn('@koishijs/plugin-market is only available for json/yaml config file')
  }

  ctx.plugin(Installer, config.registry)

  ctx.inject(['installer'], (ctx) => {
    ctx.i18n.define('zh-CN', require('./locales/message.zh-CN'))

    ctx.command('plugin.install <name>', { authority: 4 })
      .alias('.i')
      .action(async ({ session }, name) => {
        if (!name) return session.text('.expect-name')

        // check local dependencies
        const names = ctx.installer.resolveName(name)
        const deps = await ctx.installer.getDeps()
        name = names.find((name) => deps[name])
        if (name) return session.text('.already-installed')

        // find proper version
        const result = await ctx.installer.findVersion(names)
        if (!result) return session.text('.not-found')

        // set restart message
        ctx.loader.envData.message = {
          ...pick(session, ['sid', 'channelId', 'guildId', 'isDirect']),
          content: session.text('.success'),
        }
        await ctx.installer.install(result)
        ctx.loader.envData.message = null
        return session.text('.success')
      })

    ctx.command('plugin.uninstall <name>', { authority: 4 })
      .alias('.r')
      .action(async ({ session }, name) => {
        if (!name) return session.text('.expect-name')

        // check local dependencies
        const names = ctx.installer.resolveName(name)
        const deps = await ctx.installer.getDeps()
        name = names.find((name) => deps[name])
        if (!name) return session.text('.not-installed')

        await ctx.installer.install({ [name]: null })
        return session.text('.success')
      })

    ctx.command('plugin.upgrade [name...]', { authority: 4 })
      .alias('.update', '.up')
      .option('self', '-s, --koishi')
      .action(async ({ session, options }, ...names) => {
        async function getPackages(names: string[]) {
          if (!names.length) return Object.keys(deps)
          names = names.map((name) => {
            const names = ctx.installer.resolveName(name)
            return names.find((name) => deps[name])
          }).filter(Boolean)
          if (options.self) names.push('koishi')
          return names
        }

        // refresh dependencies
        ctx.installer.refresh(true)
        const deps = await ctx.installer.getDeps()
        names = await getPackages(names)
        names = names.filter((name) => {
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

        ctx.loader.envData.message = {
          ...pick(session, ['sid', 'channelId', 'guildId', 'isDirect']),
          content: session.text('.success'),
        }
        await ctx.installer.install(names.reduce((result, name) => {
          result[name] = deps[name].latest
          return result
        }, {}))
        ctx.loader.envData.message = null
        return session.text('.success')
      })
  })

  ctx.inject(['console', 'installer'], (ctx) => {
    ctx.plugin(DependencyProvider)
    ctx.plugin(RegistryProvider)
    ctx.plugin(MarketProvider, config.search)

    ctx.console.addEntry({
      dev: resolve(__dirname, '../../client/index.ts'),
      prod: resolve(__dirname, '../../dist'),
    })

    ctx.console.addListener('market/install', async (deps, forced) => {
      const code = await ctx.installer.install(deps, forced)
      ctx.get('console')?.refresh('dependencies')
      ctx.get('console')?.refresh('registry')
      ctx.get('console')?.refresh('packages')
      return code
    }, { authority: 4 })

    ctx.console.addListener('market/registry', async (name) => {
      return ctx.installer.getPackage(name)
    }, { authority: 4 })
  })
}
