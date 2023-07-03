import { Context, Dict, EffectScope, Logger, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { PackageJson, SearchObject, SearchResult } from '@koishijs/registry'
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
  cache: Dict<PackageProvider.RuntimeData> = {}

  constructor(ctx: Context) {
    super(ctx, 'packages', { authority: 4 })

    const callback = debounce(0, this.update.bind(this))
    ctx.on('internal/runtime', callback)
    ctx.on('internal/fork', callback)

    ctx.console.addListener('config/request-runtime', async (name) => {
      const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      this.cache[shortname] = await this.parseExports(name)
      this.refresh(false)
    }, { authority: 4 })
  }

  abstract collect(forced: boolean): Promise<PackageProvider.Data[]>
  abstract import(key: string): Promise<any>

  update(state: EffectScope) {
    const shortname = this.ctx.loader.keyFor(state.runtime.plugin)
    if (!this.cache[shortname]) return
    this.parseRuntime(state, this.cache[shortname])
    this.refresh(false)
  }

  parseRuntime(state: EffectScope, result: PackageProvider.RuntimeData) {
    result.id = state.runtime.uid
    result.forkable = state.runtime.isForkable
  }

  async get(forced = false) {
    const objects = (await this.collect(forced)).slice()
    for (const object of objects) {
      object.name = object.package?.name || ''
      if (!this.cache[object.shortname]) continue
      object.runtime = this.cache[object.shortname]
    }

    // add app config
    objects.unshift({
      name: '',
      runtime: {
        schema: Context.Config,
      },
      package: { name: '' },
    } as any as PackageProvider.Data)
    return Object.fromEntries(objects.map(data => [data.name, data]))
  }

  async parseExports(name: string) {
    try {
      const exports = await this.import(name)
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
  export interface Data extends Pick<SearchObject, 'shortname' | 'workspace' | 'manifest' | 'portable'> {
    name?: string
    runtime?: RuntimeData
    package: Pick<PackageJson, 'name' | 'version' | 'peerDependencies' | 'peerDependenciesMeta'>
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
