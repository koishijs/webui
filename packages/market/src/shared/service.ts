import { DataService } from '@koishijs/plugin-console'
import { Context, Dict } from 'koishi'

export class ServiceProvider extends DataService<Dict<string>> {
  constructor(ctx: Context) {
    super(ctx, 'services')
    ctx.on('internal/service', () => this.refresh())
  }

  async get() {
    const services = {} as Dict<string>
    const descriptors = Object.getOwnPropertyDescriptors(Context.prototype)
    for (const key in descriptors) {
      const desc = descriptors[key]
      if ('value' in desc) continue
      const uid = this.ctx[key]?.[Context.source]?.state.uid
      if (uid) services[key] = uid
    }
    return services
  }
}
