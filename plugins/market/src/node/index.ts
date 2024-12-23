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
    'market/registry'(names: string[]): Promise<Dict<Dict<Pick<RemotePackage, DependencyMetaKey>>>>
  }
}

export const name = 'market'
export const inject = ['http']

export const usage = `
如果插件市场页面提示「无法连接到插件市场」，则可以选择一个 Koishi 社区提供的镜像地址，填入下方对应的配置项中。

## 插件市场（填入 search.endpoint）

- [t4wefan](https://k.ilharp.cc/2611)（大陆）：https://registry.koishi.t4wefan.pub/index.json
- [Lipraty](https://k.ilharp.cc/3530)（大陆）：https://koi.nyan.zone/registry/index.json
- [itzdrli](https://k.ilharp.cc/9975)（全球）：https://kp.itzdrli.cc
- [Q78KG](https://k.ilharp.cc/10042)（全球）：https://koishi-registry.yumetsuki.moe/index.json
- Koishi（全球）：https://registry.koishi.chat/index.json

要浏览更多社区镜像，请访问 [Koishi 论坛上的镜像一览](https://k.ilharp.cc/4000)。`

// ## 软件源（填入 npmRegistryServer）

// - 淘宝（大陆）：https://registry.npmmirror.com
// - 腾讯（大陆）：https://mirrors.cloud.tencent.com/npm
// - npm（全球）：https://registry.npmjs.org
// - yarn（全球）：https://registry.yarnpkg.com

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

    ctx.console.addListener('market/registry', async (names) => {
      const meta = await Promise.all(names.map(name => ctx.installer.getPackage(name)))
      return Object.fromEntries(meta.map((meta, index) => [names[index], meta]))
    }, { authority: 4 })
  })
}
