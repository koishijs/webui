import { Context, Dict, version } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { Dependency } from '../shared'

class Dependencies extends DataService<Dict<Dependency>> {
  constructor(public ctx: Context) {
    super(ctx, 'dependencies', { authority: 4 })
  }

  async get(force = false) {
    const objects = this.ctx.loader.market.objects.filter(o => o.portable)
    objects.push({
      name: 'koishi',
      version,
      versions: {
        [version]: {},
      },
    } as any)
    return Object.fromEntries(objects.map((object) => [object.name, {
      request: object.version,
      resolved: object.version,
      versions: object.versions,
      latest: object.version,
    }]))
  }
}

export default Dependencies
