import { Context, Dict, Logger, remove, Schema, Time } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { mkdir, readdir, rm } from 'fs/promises'
import { FileWriter } from './file'
import { throttle } from 'throttle-debounce'
import zhCN from './locales/zh-CN.yml'

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      logs: DataService<Logger.Record[]>
    }
  }
}

export const name = 'logger'

class LogProvider extends DataService<Logger.Record[]> {
  constructor(ctx: Context, private getWriter: () => FileWriter) {
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

  async get() {
    return this.getWriter()?.read()
  }
}

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

export async function apply(ctx: Context, config: Config) {
  const root = resolve(ctx.baseDir, config.root)
  await mkdir(root, { recursive: true })

  const files: Dict<number[]> = {}
  for (const filename of await readdir(root)) {
    const capture = /^(\d{4}-\d{2}-\d{2})-(\d+)\.log$/.exec(filename)
    if (!capture) continue
    files[capture[1]] ??= []
    files[capture[1]].push(+capture[2])
  }

  let writer: FileWriter
  async function createFile(date: string, index: number) {
    writer = new FileWriter(date, `${root}/${date}-${index}.log`)

    const { maxAge } = config
    if (!maxAge) return

    const now = Date.now()
    for (const date of Object.keys(files)) {
      if (now - +new Date(date) < maxAge * Time.day) continue
      for (const index of files[date]) {
        await rm(`${root}/${date}-${index}.log`).catch((error) => {
          ctx.logger('logger').warn(error)
        })
      }
      delete files[date]
    }
  }

  const date = new Date().toISOString().slice(0, 10)
  createFile(date, Math.max(...files[date] ?? [0]) + 1)

  let buffer: Logger.Record[] = []
  const update = throttle(100, () => {
    // Be very careful about accessing service in this callback,
    // because undeclared service access may cause infinite loop.
    ctx.get('console')?.patch('logs', buffer)
    buffer = []
  })

  const loader = ctx.get('loader')
  const target: Logger.Target = {
    colors: 3,
    record: (record: Logger.Record) => {
      record.meta ||= {}
      const scope = record.meta[Context.current]?.scope
      if (loader && scope) {
        record.meta.paths = loader.paths(scope)
      }
      const date = new Date(record.timestamp).toISOString().slice(0, 10)
      if (writer.date !== date) {
        writer.close()
        files[date] = [1]
        createFile(date, 1)
      }
      writer.write(record)
      buffer.push(record)
      update()
      if (writer.size >= config.maxSize) {
        writer.close()
        const index = Math.max(...files[date] ?? [0]) + 1
        files[date].push(index)
        createFile(date, index)
      }
    },
  }

  Logger.targets.push(target)
  ctx.on('dispose', () => {
    writer?.close()
    remove(Logger.targets, target)
    if (loader) {
      loader.prolog = []
    }
  })

  for (const record of loader?.prolog || []) {
    target.record(record)
  }

  ctx.plugin(LogProvider, () => writer)
}
