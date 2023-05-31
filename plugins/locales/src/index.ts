import { Context, Dict, I18n, Logger, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { debounce } from 'throttle-debounce'
import { dump, load } from 'js-yaml'
import { Stats } from 'fs'

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

const logger = new Logger('locales')

class LocaleProvider extends DataService<Dict<I18n.Store>> {
  update = debounce(0, () => this.refresh())

  constructor(ctx: Context, private config: LocaleProvider.Config) {
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
        await writeFile(resolve(ctx.baseDir, config.root, locale + '.yml'), content)
      }
    })
  }

  // cp() can only be used since node 16
  async cp(src: string, dest: string) {
    const dirents = await readdir(src, { withFileTypes: true })
    for (const dirent of dirents) {
      const srcFile = join(src, dirent.name)
      const destFile = join(dest, dirent.name)
      if (dirent.isFile()) {
        await copyFile(srcFile, destFile)
      } else if (dirent.isDirectory()) {
        await mkdir(destFile)
        await this.cp(srcFile, destFile)
      }
    }
  }

  async start() {
    const legacy = resolve(this.ctx.baseDir, 'locales')
    const folder = resolve(this.ctx.baseDir, this.config.root)
    await mkdir(folder, { recursive: true })
    const stats: Stats = await stat(legacy).catch(() => null)
    if (stats?.isDirectory()) {
      logger.info('migrating to data directory')
      await this.cp(legacy, folder)
      await rm(legacy, { recursive: true, force: true })
    }
    const files = await readdir(folder)
    for (const file of files) {
      if (!file.endsWith('.yml')) continue
      logger.debug('loading locale %s', file)
      const content = await readFile(resolve(folder, file), 'utf8')
      this.ctx.i18n.define('$' + file.split('.')[0], load(content) as any)
    }
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
    root: Schema.string().default('data/locales').description('存放本地化文件的根目录。'),
  })
}

export default LocaleProvider
