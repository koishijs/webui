import { Context, Dict, EffectScope, Logger, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { Manifest, PackageJson, SearchResult } from '@koishijs/registry'
import { debounce } from 'throttle-debounce'

declare module '@koishijs/loader' {
  interface Loader {
    market: SearchResult
  }
}

declare module '@koishijs/plugin-console' {
  interface Events {
    'config/request-runtime'(name: string): void
  }
}

const logger = new Logger('config')

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

  parseRuntime(state: EffectScope, result: PackageProvider.RuntimeData) {
    result.id = state.runtime.uid
    result.forkable = state.runtime.isForkable
  }

  async parseExports(name: string, callback: () => Promise<any>) {
    try {
      const exports = await callback()
      const result: PackageProvider.RuntimeData = {}
      result.schema = exports?.Config || exports?.schema
      result.usage = exports?.usage

      // make sure that result can be serialized into json
      JSON.stringify(result)

      const runtime = this.ctx.registry.get(exports)
      if (runtime) this.parseRuntime(runtime, result)
      return result
    } catch (error) {
      logger.warn('failed to load %c', name)
      logger.warn(error)
      return { failed: true }
    }
  }
}

export namespace PackageProvider {
  export interface Data extends Partial<PackageJson> {
    runtime?: RuntimeData
    portable?: boolean
    shortname?: string
    workspace?: boolean
    manifest?: Manifest
  }

  export interface RuntimeData {
    id?: number
    filter?: boolean
    forkable?: boolean
    schema?: Schema
    usage?: string
    failed?: boolean
  }
}
