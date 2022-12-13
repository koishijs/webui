import { Context, Dict, I18n, Logger, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { promises as fsp } from 'fs'
import { resolve } from 'path'
import { debounce } from 'throttle-debounce'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      locales: LocaleProvider
    }
  }
}

export const name = 'locales'

const logger = new Logger('locales')

class LocaleProvider extends DataService<Dict<I18n.Store>> {
  static using = ['console'] as const

  update = debounce(0, () => this.refresh())

  constructor(ctx: Context, private config: LocaleProvider.Config) {
    super(ctx, 'locales', { authority: 4 })

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  }

  async start() {
    const folder = resolve(this.ctx.baseDir, this.config.root)
    const created = await fsp.mkdir(folder, { recursive: true })
    if (!created) {
      const files = await fsp.readdir(folder)
      for (const file of files) {
        logger.info('loading locale %s', file)
        this.ctx.i18n.define('$' + file.split('.')[0], require(folder + '/' + file))
      }
    }
    this.ctx.on('internal/i18n', this.update)
  }

  async get() {
    return this.ctx.i18n._data
  }
}

namespace LocaleProvider {
  export interface Config {
    root?: string
  }

  export const Config: Schema<Config> = Schema.object({
    root: Schema.string().default('locales').description('存放本地化文件的根目录。'),
  })
}

export default LocaleProvider
