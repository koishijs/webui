import { Context, Logger, remove } from 'koishi'
import { LocalScanner } from '@koishijs/registry'
import { unwrapExports } from '@koishijs/loader'
import * as shared from '../shared'

const logger = new Logger('config')

class PackageScanner extends LocalScanner {
  constructor(private service: PackageProvider) {
    super(service.ctx.baseDir)
  }

  async onError(error: any, name: string) {
    logger.warn('failed to resolve %c', name)
    logger.warn(error)
  }

  async parsePackage(name: string, entry: string) {
    const result = await super.parsePackage(name, entry)
    if (require.cache[entry]) {
      const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      this.service.cache[shortname] = await this.service.parseExports(name)
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
}
