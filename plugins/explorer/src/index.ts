import { Context, Schema } from 'koishi'
import { DataService } from '@koishijs/console'
import { join, relative, resolve } from 'path'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'fs/promises'
import { FSWatcher, watch } from 'chokidar'
import { detect } from 'chardet'
import FileType from 'file-type'
import anymatch, { Tester } from 'anymatch'
import zhCN from './locales/zh-CN.yml'

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      explorer: Explorer
    }
  }

  interface Events {
    'explorer/read'(filename: string, binary?: boolean): Promise<File>
    'explorer/write'(filename: string, content: string, binary?: boolean): Promise<void>
    'explorer/mkdir'(filename: string): Promise<void>
    'explorer/remove'(filename: string): Promise<void>
    'explorer/rename'(oldValue: string, newValue: string): Promise<void>
    'explorer/refresh'(): void
  }
}

export interface File {
  base64: string
  mime: string
  encoding: string
}

export interface Entry {
  type: 'file' | 'directory'
  name: string
  mime?: string
  filename?: string
  children?: this[]
  oldValue?: string
  newValue?: string
  loading?: Promise<File>
}

class Explorer extends DataService<Entry[]> {
  task: Promise<Entry[]>
  watcher: FSWatcher
  globFilter: Tester

  constructor(ctx: Context, config: Explorer.Config) {
    super(ctx, 'explorer', { authority: 4 })

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

    const cwd = resolve(ctx.baseDir, config.root)
    this.watcher = watch(cwd, {
      cwd,
      ignored: config.ignored,
    })

    ctx.console.addListener('explorer/read', async (filename, binary) => {
      filename = join(cwd, filename)
      const buffer = await readFile(filename)
      const result = await FileType.fromBuffer(buffer)
      return {
        base64: buffer.toString('base64'),
        mime: result?.mime,
        encoding: detect(buffer),
      }
    }, { authority: 4 })

    ctx.console.addListener('explorer/write', async (filename, content, binary) => {
      filename = join(ctx.baseDir, filename)
      if (binary) {
        const buffer = Buffer.from(content, 'base64')
        await writeFile(filename, buffer)
      } else {
        await writeFile(filename, content, 'utf8')
      }
      this.refresh()
    }, { authority: 4 })

    ctx.console.addListener('explorer/mkdir', async (filename) => {
      filename = join(ctx.baseDir, filename)
      await mkdir(filename)
      this.refresh()
    }, { authority: 4 })

    ctx.console.addListener('explorer/remove', async (filename) => {
      filename = join(ctx.baseDir, filename)
      await rm(filename, { recursive: true })
      this.refresh()
    }, { authority: 4 })

    ctx.console.addListener('explorer/rename', async (oldValue, newValue) => {
      oldValue = join(ctx.baseDir, oldValue)
      newValue = join(ctx.baseDir, newValue)
      await rename(oldValue, newValue)
      this.refresh()
    }, { authority: 4 })

    ctx.console.addListener('explorer/refresh', () => {
      this.refresh()
    }, { authority: 4 })
  }

  stop() {
    this.watcher?.close()
  }

  private async traverse(root: string): Promise<Entry[]> {
    const dirents = await readdir(root, { withFileTypes: true })
    return Promise.all(dirents.map<Promise<Entry>>(async (dirent) => {
      const filename = join(root, dirent.name)
      if (this.globFilter(relative(this.ctx.baseDir, filename))) return
      if (dirent.isFile()) {
        return { type: 'file', name: dirent.name }
      } else if (dirent.isDirectory()) {
        return { type: 'directory', name: dirent.name, children: await this.traverse(filename) }
      }
    })).then((entries) => entries
      .filter(Boolean)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      }))
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
  export interface Config {
    root?: string
    ignored?: string[]
  }

  export const Config: Schema<Config> = Schema.object({
    root: Schema.string().default(''),
    ignored: Schema
      .array(String)
      .role('table')
      .default(['**/node_modules', '**/.*', 'data/accounts/*/data', 'cache']),
  }).i18n({
    'zh-CN': zhCN,
  })
}

export default Explorer
