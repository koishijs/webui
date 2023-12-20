import { Logger } from 'koishi'
import { LocalScanner } from '@koishijs/registry'
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

  async parsePackage(name: string) {
    const result = await super.parsePackage(name)
    try {
      // require.resolve(name) may be different from require.resolve(path)
      // because tsconfig-paths may resolve the path differently
      const entry = require.resolve(name)
      if (require.cache[entry]) {
        name = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
        this.service.cache[name] = await this.service.parseExports(name)
      }
    } catch (error) {
      this.onError(error, name)
    }
    return result
  }
}

export class PackageProvider extends shared.PackageProvider {
  scanner = new PackageScanner(this)

  async collect(forced: boolean) {
    await this.scanner.collect(forced)
    return this.scanner.objects
  }
}
