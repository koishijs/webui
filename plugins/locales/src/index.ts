import { Context, Dict, I18n, Logger, Schema } from 'koishi'
import { DataService } from '@koishijs/console'
import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { debounce } from 'throttle-debounce'
import { dump, load } from 'js-yaml'

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      locales: LocaleProvider
    }
  }

  interface Events {
    'l10n'(data: Dict<I18n.Store>): void
  }
}

const logger = new Logger('locales')

class LocaleProvider extends DataService<Dict<I18n.Store>> {
  update = debounce(0, () => this.refresh())

  constructor(ctx: Context, private config: Config) {
    super(ctx, 'locales', { authority: 4 })

    ctx.on('internal/i18n', this.update)

    ctx.console.addEntry(process.env.KOISHI_BASE ? [
      process.env.KOISHI_BASE + '/dist/index.js',
      process.env.KOISHI_BASE + '/dist/style.css',
    ] : process.env.KOISHI_ENV === 'browser' ? [
      // @ts-ignore
      import.meta.url.replace(/\/src\/[^/]+$/, '/client/index.ts'),
    ] : {
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })

    ctx.console.addListener('l10n', async (data) => {
      for (const locale in data) {
        ctx.i18n.define('$' + locale, data[locale])
        const content = dump(data[locale])
        await writeFile(resolve(ctx.baseDir, config.root[0], locale + '.yml'), content)
      }
    })
  }

  async get() {
    return this.ctx.i18n._data
  }
}

export const name = 'locales'

export interface Config {
  root?: string[]
}

export const Config: Schema<Config> = Schema.object({
  root: Schema.union([
    Schema.array(Schema.path({
      filters: ['directory'],
      allowCreate: true,
    })),
    Schema.transform(String, (root) => [root]),
  ]).default(['data/locales', 'locales']).description('存放本地化文件的根目录。'),
})

export async function apply(ctx: Context, config: Config) {
  for (const root of config.root.slice().reverse()) {
    const folder = resolve(ctx.baseDir, root)
    await mkdir(folder, { recursive: true })
    const files = await readdir(folder)
    for (const file of files) {
      if (!file.endsWith('.yml')) continue
      logger.debug('loading locale %s', file)
      const content = await readFile(resolve(folder, file), 'utf8')
      ctx.i18n.define('$' + file.split('.')[0], load(content) as any)
    }
  }

  ctx.plugin(LocaleProvider, config)
}
