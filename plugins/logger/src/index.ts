import { Context, Dict, Logger, remove, Schema, Time } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { mkdir, readdir, rm } from 'fs/promises'
import { FileWriter } from './file'
import zhCN from './locales/zh-CN.yml'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      logs: LogProvider
    }
  }
}

class LogProvider extends DataService<Logger.Record[]> {
  root: string
  date: string
  files: Dict<number> = {}
  writer: FileWriter

  constructor(ctx: Context, private config: LogProvider.Config = {}) {
    super(ctx, 'logs', { authority: 4 })

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
  }

  async start() {
    await this.prepareWriter()
    this.prepareLogger()
    this.refresh()
  }

  async stop() {
    await this.writer?.close()
    this.writer = null
  }

  async prepareWriter() {
    this.root = resolve(this.ctx.baseDir, this.config.root)
    await mkdir(this.root, { recursive: true })

    for (const filename of await readdir(this.root)) {
      const capture = /^(\d{4}-\d{2}-\d{2})-(\d+)\.log$/.exec(filename)
      if (!capture) continue
      this.files[capture[1]] = Math.max(this.files[capture[1]] ?? 0, +capture[2])
    }

    const date = new Date().toISOString().slice(0, 10)
    this.createFile(date, this.files[date] ??= 1)
  }

  async createFile(date: string, index: number) {
    this.writer = new FileWriter(date, `${this.root}/${date}-${index}.log`)

    const { maxAge } = this.config
    if (!maxAge) return

    const now = Date.now()
    for (const date in this.files) {
      if (now - +new Date(date) < maxAge * Time.day) continue
      for (let index = 1; index <= this.files[date]; ++index) {
        await rm(`${this.root}/${date}-${index}.log`)
      }
    }
  }

  prepareLogger() {
    const target: Logger.Target = {
      colors: 3,
      record: this.record.bind(this),
    }

    Logger.targets.push(target)
    this.ctx.on('dispose', () => {
      remove(Logger.targets, target)
      if (this.ctx.loader) {
        this.ctx.loader.prolog = []
      }
    })

    for (const record of this.ctx.loader?.prolog || []) {
      this.record(record)
    }
  }

  record(record: Logger.Record) {
    const date = new Date(record.timestamp).toISOString().slice(0, 10)
    if (this.writer.date !== date) {
      this.writer.close()
      this.createFile(date, this.files[date] = 1)
    }
    this.writer.write(record)
    this.patch([record])
    if (this.writer.size >= this.config.maxSize) {
      this.writer.close()
      this.createFile(date, ++this.files[date])
    }
  }

  async get() {
    return this.writer?.read()
  }
}

namespace LogProvider {
  export interface Config {
    root?: string
    maxAge?: number
    maxSize?: number
  }

  export const Config: Schema<Config> = Schema.object({
    root: Schema.path({
      filters: ['directory'],
      allowCreate: true,
    }).default('data/logs'),
    maxAge: Schema.natural().default(30),
    maxSize: Schema.natural().default(1024 * 100),
  }).i18n({
    'zh-CN': zhCN,
  })
}

export default LogProvider
