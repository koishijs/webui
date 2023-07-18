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

  async parsePackage(name: string, entry: string) {
    const result = await super.parsePackage(name, entry)
    if (require.cache[entry]) {
      name = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      this.service.cache[name] = await this.service.parseExports(name)
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
