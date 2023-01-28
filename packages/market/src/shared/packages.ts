import { Context, Dict, EffectScope, MainScope, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { Manifest, PackageJson } from '@koishijs/registry'
import { debounce } from 'throttle-debounce'

export abstract class PackageProvider extends DataService<Dict<PackageProvider.Data>> {
  constructor(ctx: Context) {
    super(ctx, 'packages', { authority: 4 })

    const callback = debounce(0, this.update.bind(this))
    ctx.on('internal/runtime', callback)
    ctx.on('internal/fork', callback)
  }

  abstract getManifest(name: string): Promise<Manifest>

  update(state: EffectScope) {
    this.refresh()
  }

  parseRuntime(runtime: MainScope, result: PackageProvider.Data) {
    result.id = runtime.uid
    result.forkable = runtime.isForkable
  }
}

export namespace PackageProvider {
  export interface Data extends Partial<PackageJson> {
    id?: number
    portable?: boolean
    forkable?: boolean
    shortname?: string
    schema?: Schema
    usage?: string
    filter?: boolean
    workspace?: boolean
    manifest?: Manifest
  }
}
