import { Context, Dict, I18n, Logger, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { promises as fsp } from 'fs'
import { resolve } from 'path'
import { debounce } from 'throttle-debounce'
import { dump, load } from 'js-yaml'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      locales: LocaleProvider
    }
  }

  interface Events {
    'l10n'(data: Dict<I18n.Store>): void
  }
}

export const filter = false
export const name = 'locales'

const logger = new Logger('locales')

export interface Config {
  root?: string
}

export const Config: Schema<Config> = Schema.object({
  root: Schema.string().default('locales').description('存放本地化文件的根目录。'),
})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(LocaleProvider, config)

  ctx.on('ready', async () => {
    const folder = resolve(ctx.baseDir, config.root)
    const created = await fsp.mkdir(folder, { recursive: true })
    if (created) return
    const files = await fsp.readdir(folder)
    for (const file of files) {
      if (!file.endsWith('.yml')) continue
      logger.info('loading locale %s', file)
      const content = await fsp.readFile(resolve(folder, file), 'utf8')
      ctx.i18n.define('$' + file.split('.')[0], load(content) as any)
    }
  })
}

class LocaleProvider extends DataService<Dict<I18n.Store>> {
  static using = ['console'] as const

  update = debounce(0, () => this.refresh())

  constructor(ctx: Context, config: Config) {
    super(ctx, 'locales', { authority: 4 })

    ctx.on('internal/i18n', this.update)

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })

    ctx.console.addListener('l10n', async (data) => {
      for (const locale in data) {
        ctx.i18n.define('$' + locale, data[locale])
        const content = dump(data[locale])
        await fsp.writeFile(resolve(ctx.baseDir, config.root, locale + '.yml'), content)
      }
    })
  }

  async get() {
    return this.ctx.i18n._data
  }
}
