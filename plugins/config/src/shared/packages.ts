import { Context, Dict, EffectScope, Logger, Plugin, Schema } from 'koishi'
import { DataService } from '@koishijs/console'
import { PackageJson, SearchObject, SearchResult } from '@koishijs/registry'
import { debounce } from 'throttle-debounce'
import {} from '@koishijs/plugin-hmr'

declare module '@koishijs/loader' {
  interface Loader {
    market: SearchResult
  }
}

declare module '@koishijs/console' {
  interface Events {
    'config/request-runtime'(name: string): void
  }
}

const logger = new Logger('config')

export abstract class PackageProvider extends DataService<Dict<PackageProvider.Data>> {
  cache: Dict<PackageProvider.RuntimeData> = {}
  debouncedRefresh = debounce(0, this.refresh.bind(this, false))

  constructor(public ctx: Context) {
    super(ctx, 'packages', { authority: 4 })

    ctx.on('internal/runtime', scope => this.update(scope.runtime.plugin))
    ctx.on('internal/fork', scope => this.update(scope.runtime.plugin))
    ctx.on('hmr/reload', (reloads) => {
      for (const [plugin] of reloads) {
        this.update(plugin)
      }
    })

    ctx.console.addListener('config/request-runtime', async (name) => {
      name = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      this.cache[name] = await this.parseExports(name)
      this.refresh(false)
    }, { authority: 4 })
  }

  abstract collect(forced: boolean): Promise<PackageProvider.Data[]>

  async update(plugin: Plugin) {
    const name = this.ctx.loader.keyFor(plugin)
    if (!this.cache[name]) return
    this.cache[name] = await this.parseExports(name)
    this.debouncedRefresh()
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
      const exports = await this.ctx.loader.resolvePlugin(name)
      const result: PackageProvider.RuntimeData = {}
      result.schema = exports?.Config || exports?.schema
      result.usage = exports?.usage
      result.filter = exports?.filter

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
