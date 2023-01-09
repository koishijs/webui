import { Context, Dict, observe, Schema, User } from 'koishi'
import { DataService, SocketHandle } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { SandboxBot, words } from './bot'
import zh from './locales/zh.yml'

declare module 'koishi' {
  interface User {
    sandbox: string
  }

  namespace Session {
    interface Payload {
      handle: SocketHandle
    }
  }
}

declare module '@koishijs/plugin-console' {
  interface SocketHandle {
    sandbox: SandboxBot
  }

  interface Events {
    'sandbox/message'(this: SocketHandle, user: string, channel: string, content: string): void
    'sandbox/user'(this: SocketHandle, name: string, data: Partial<User>): void
  }

  namespace Console {
    interface Services {
      sandbox: UserProvider
    }
  }
}

export interface Message {
  user: string
  channel: string
  content: string
}

export class UserProvider extends DataService<Dict<User>> {
  static using = ['database'] as const
  private task: Promise<Dict<User.Observed>>

  constructor(ctx: Context) {
    super(ctx, 'sandbox', { authority: 4 })

    ctx.console.addListener('sandbox/user', async (name, data) => {
      const sandbox = await this.get()
      if (!sandbox[name]) {
        if (!data) return
        const user = await this.ctx.database.createUser('sandbox', name, {
          authority: 1,
          ...data,
        })
        return this.observe(user, sandbox)
      } else if (!data) {
        delete sandbox[name]
        this.ctx.$internal._userCache.set('sandbox', 'sandbox:' + name, null)
        return this.ctx.database.remove('user', { sandbox: name })
      }
      Object.assign(sandbox[name], data)
      return sandbox[name].$update()
    }, { authority: 4 })
  }

  observe(user: User, sandbox: Dict<User.Observed>) {
    const uid = 'sandbox:' + user.sandbox
    sandbox[user.sandbox] = observe(user, async (diff) => {
      await this.ctx.database.setUser('sandbox', user.sandbox, diff)
      this.refresh()
    })
    this.ctx.$internal._userCache.set('sandbox', uid, sandbox[user.sandbox])
  }

  async prepare() {
    const data = await this.ctx.database.getUser('sandbox', words)
    const result: Dict<User.Observed> = {}
    for (const user of data) {
      this.observe(user, result)
    }
    return result
  }

  stop() {
    // keep user cache active until disposed
    this.ctx.$internal._userCache.delete('sandbox')
  }

  async get() {
    return this.task ||= this.prepare()
  }
}

export const name = 'sandbox'

export const using = ['console']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(SandboxBot)
  ctx.plugin(UserProvider)

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

  ctx.i18n.define('zh', zh)

  ctx.platform('sandbox').command('clear')
    .action(({ session }) => {
      session.handle.send({
        type: 'sandbox/clear',
      })
    })
}
