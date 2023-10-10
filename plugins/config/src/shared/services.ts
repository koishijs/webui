import { DataService } from '@koishijs/console'
import { Context, Dict } from 'koishi'

export class ServiceProvider extends DataService<Dict<number>> {
  constructor(ctx: Context) {
    super(ctx, 'services')
    ctx.on('internal/service', () => this.refresh())
  }

  async get() {
    const services = {} as Dict<number>
    const descriptors = Object.getOwnPropertyDescriptors(Context.prototype)
    for (const key in descriptors) {
      const desc = descriptors[key]
      if ('value' in desc) continue
      const ctx: Context = this.ctx[key]?.[Context.source]
      if (ctx?.scope.uid) {
        const name = key.replace(/^__/, '').replace(/__$/, '')
        services[name] = ctx.scope.uid
      }
    }
    return services
  }
}
