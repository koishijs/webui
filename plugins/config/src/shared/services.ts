import { DataService } from '@koishijs/console'
import { Context, Dict } from 'koishi'

export class ServiceProvider extends DataService<Dict<number>> {
  constructor(ctx: Context) {
    super(ctx, 'services')
    ctx.on('internal/service', () => this.refresh())
  }

  async get() {
    const services = {} as Dict<number>
    for (const key in this.ctx.root[Context.internal]) {
      const ctx: Context = this.ctx[key]?.[Context.source]
      if (ctx?.scope.uid) {
        const name = key.replace(/^__/, '').replace(/__$/, '')
        services[name] = ctx.scope.uid
      }
    }
    return services
  }
}
