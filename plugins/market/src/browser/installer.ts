import { Context, Dict, version } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { PackageJson } from '@koishijs/registry'
import {} from '@koishijs/plugin-config'

declare module '@koishijs/plugin-console' {
  interface Events {
    'market/install'(deps: Dict<string>): Promise<number>
  }
}

export interface Dependency {
  /**
   * requested semver range
   * @example `^1.2.3` -> `1.2.3`
   */
  request: string
  /**
   * installed package version
   * @example `1.2.5`
   */
  resolved?: string
  /** whether it is a workspace package */
  workspace?: boolean
  /** all available versions */
  versions?: Dict<Partial<PackageJson>>
  /** latest version */
  latest?: string
}

class Installer extends DataService<Dict<Dependency>> {
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

export default Installer
