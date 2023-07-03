import { Context, EffectScope, Logger, remove } from 'koishi'
import { LocalScanner } from '@koishijs/registry'
import { unwrapExports } from '@koishijs/loader'
import * as shared from '../shared'

const logger = new Logger('config')

class PackageScanner extends LocalScanner {
  constructor(private service: PackageProvider) {
    super(service.ctx.baseDir)
  }

  async onError(error: any) {
    logger.warn('failed to resolve %c', name)
    logger.warn(error)
  }

  async parsePackage(name: string, entry: string) {
    const result = await super.parsePackage(name, entry)
    if (require.resolve[entry]) {
      this.service.cache[name] = await this.service.parseExports(name)
    }
    return result
  }
}

export class PackageProvider extends shared.PackageProvider {
  scanner = new PackageScanner(this)

  constructor(public ctx: Context) {
    super(ctx)
  }

  /** require without affecting the dependency tree */
  import(id: string) {
    const path = require.resolve(id)
    const keys = Object.keys(require.cache)
    let result = require.cache[path]
    if (!result) {
      require(path)
      result = require.cache[path]
      remove(module.children, result)
      for (const key in require.cache) {
        if (!keys.includes(key)) {
          delete require.cache[key]
        }
      }
    }
    return unwrapExports(result.exports)
  }

  async collect(forced: boolean) {
    await this.scanner.collect(forced)
    return this.scanner.objects
  }

  update(state: EffectScope) {
    const entry = Object.keys(require.cache).find((key) => {
      return unwrapExports(require.cache[key].exports) === state.runtime.plugin
    })
    if (!this.cache[entry]) return
    this.parseRuntime(state, this.cache[entry])
    this.refresh(false)
  }
}
