import { Context, remove, Schema, Service } from 'koishi'
import type { Entry } from '@koishijs/plugin-console'
import { resolve } from 'path'

declare module 'koishi' {
  interface Context {
    notifier: NotifierService
  }
}

class Notifier {
  public config: Required<Notifier.Config>
  public dispose: () => void

  constructor(public ctx: Context, config: string | Notifier.Config) {
    this.config = {
      type: 'primary',
      content: '',
      ...Notifier.resolve(config),
    }
    ctx.notifier.store.push(this)
    ctx.notifier.entry?.refresh()
    this.dispose = ctx.collect('entry', () => {
      remove(ctx.notifier.store, this)
      ctx.notifier.entry?.refresh()
    })
  }

  update(config: string | Notifier.Config) {
    Object.assign(this.config, Notifier.resolve(config))
    this.ctx.notifier.entry?.refresh()
  }

  toJSON(): Notifier.Data {
    return {
      ...this.config,
      paths: this.ctx.loader?.paths(this.ctx.scope),
    }
  }
}

namespace Notifier {
  export type Type = 'primary' | 'info' | 'success' | 'warning' | 'error'

  export interface Config {
    type?: Type
    content?: string
  }

  export function resolve(input: string | Config) {
    if (typeof input === 'object') return input
    return { content: input || '' }
  }

  export interface Data extends Required<Config> {
    paths: string[]
  }
}

class NotifierService extends Service {
  public store: Notifier[] = []
  public entry?: Entry<NotifierService.Data>

  constructor(ctx: Context, public config: NotifierService.Config) {
    super(ctx, 'notifier', true)

    ctx.inject(['console'], (ctx) => {
      ctx.on('dispose', () => this.entry = undefined)

      this.entry = ctx.console.addEntry(process.env.KOISHI_BASE ? [
        process.env.KOISHI_BASE + '/dist/index.js',
        process.env.KOISHI_BASE + '/dist/style.css',
      ] : process.env.KOISHI_ENV === 'browser' ? [
        // @ts-ignore
        import.meta.url.replace(/\/src\/[^/]+$/, '/client/index.ts'),
      ] : {
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      }, () => ({
        notifiers: this.store.map(notifier => notifier.toJSON()),
      }))
    })
  }

  create(config?: string | Notifier.Config) {
    return new Notifier(this[Context.current], config)
  }
}

namespace NotifierService {
  export interface Data {
    notifiers: Notifier.Data[]
  }

  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default NotifierService
