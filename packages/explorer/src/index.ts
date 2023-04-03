import { Context, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { relative, resolve } from 'path'
import { readdir, readFile } from 'fs/promises'
import { FSWatcher, watch } from 'chokidar'
import anymatch, { Tester } from 'anymatch'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      explorer: Explorer
    }
  }

  interface Events {
    'explorer/file'(filename: string): Promise<string>
  }
}

export interface Entry {
  type: 'file' | 'directory'
  name: string
  filename?: string
  children?: Entry[]
}

class Explorer extends DataService<Entry[]> {
  task: Promise<Entry[]>
  watcher: FSWatcher
  globFilter: Tester

  constructor(ctx: Context, config: Explorer.Config) {
    super(ctx, 'explorer')

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

    this.globFilter = anymatch(config.ignored)

    this.watcher = watch(ctx.baseDir, {
      cwd: ctx.baseDir,
      ignored: config.ignored,
    })

    ctx.console.addListener('explorer/file', (filename) => {
      return readFile(resolve(ctx.baseDir, filename), 'utf8')
    })
  }

  stop() {
    this.watcher?.close()
  }

  private async traverse(root: string): Promise<Entry[]> {
    const dirents = await readdir(root, { withFileTypes: true })
    return Promise.all(dirents.map<Promise<Entry>>(async (dirent) => {
      const filename = resolve(root, dirent.name)
      if (this.globFilter(relative(this.ctx.baseDir, filename))) return
      if (dirent.isFile()) {
        return { type: 'file', name: dirent.name }
      } else if (dirent.isDirectory()) {
        return { type: 'directory', name: dirent.name, children: await this.traverse(filename) }
      }
    })).then(entries => entries.filter(Boolean))
  }

  private async _get() {
    return this.traverse(this.ctx.baseDir)
  }

  async get(forced = false) {
    if (!forced && this.task) return this.task
    return this.task = this._get()
  }
}

namespace Explorer {
  export const filter = false
  export const using = ['console'] as const

  export interface Config {
    ignored?: string[]
  }

  export const Config: Schema<Config> = Schema.object({
    ignored: Schema
      .array(String)
      .role('table')
      .default(['**/node_modules', '**/.*', 'accounts/*/data'])
      .description('要忽略的文件或目录。支持 [Glob Patterns](https://github.com/micromatch/micromatch) 语法。'),
  })
}

export default Explorer
