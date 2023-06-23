import { Context, Dict, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { DependencyMetaKey, RemotePackage } from '@koishijs/registry'
import { Dependency } from './installer'
import { throttle } from 'throttle-debounce'

declare module '@koishijs/plugin-console' {
  interface Events {
    'market/install'(deps: Dict<string>): Promise<number>
  }
}

class Dependencies extends DataService<Dependencies.Payload> {
  constructor(public ctx: Context, public config: Dependencies.Config) {
    super(ctx, 'dependencies', { authority: 4 })

    ctx.console.addListener('market/install', async (deps) => {
      const code = await ctx.installer.install(deps)
      this.refresh()
      this.ctx.console.packages?.refresh()
      return code
    }, { authority: 4 })
  }

  stop() {
    this.flushData.cancel()
  }

  flushData = throttle(500, () => {
    this.ctx.console.broadcast('market/registry', this.ctx.installer.tempCache)
    this.ctx.installer.tempCache = {}
  })

  async get(force = false) {
    return this.ctx.installer.get(force)
  }
}

namespace Dependencies {
  export interface Config {}
  export const Config: Schema<Config> = Schema.object({})

  export interface Payload {
    dependencies: Dict<Dependency>
    registry: Dict<Dict<Pick<RemotePackage, DependencyMetaKey>>>
  }
}

export default Dependencies
