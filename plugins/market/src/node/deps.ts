import { Context, Dict, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { Dependency } from '../shared'

declare module '@koishijs/plugin-console' {
  interface Events {
    'market/install'(deps: Dict<string>): Promise<number>
  }
}

class Dependencies extends DataService<Dict<Dependency>> {
  constructor(public ctx: Context, public config: Dependencies.Config) {
    super(ctx, 'dependencies', { authority: 4 })

    ctx.console.addListener('market/install', async (deps) => {
      const code = await ctx.installer.install(deps)
      this.refresh()
      this.ctx.console.packages?.refresh()
      return code
    }, { authority: 4 })
  }

  async get(force = false) {
    return this.ctx.installer.get(force)
  }
}

namespace Dependencies {
  export interface Config {}
  export const Config: Schema<Config> = Schema.object({})
}

export default Dependencies
