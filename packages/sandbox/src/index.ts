import { Context, Dict, observe, Schema, User } from 'koishi'
import { Client, DataService } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { SandboxBot } from './bot'
import zh from './locales/zh.yml'

declare module 'koishi' {
  namespace Session {
    interface Payload {
      client: Client
    }
  }
}

declare module '@koishijs/plugin-console' {
  interface Client {
    sandbox: SandboxBot
  }

  interface Events {
    'sandbox/message'(this: Client, user: string, channel: string, content: string): void
    'sandbox/user'(this: Client, name: string, data: Partial<User>): void
  }

  namespace Console {
    interface Services {
      sandbox: UserProvider
    }
  }
}

export interface Message {
  id: string
  user: string
  channel: string
  content: string
}

export class UserProvider extends DataService<Dict<User>> {
  static using = ['database'] as const
  private task: Promise<Dict<User.Observed>>

  constructor(ctx: Context, public config: Config) {
    super(ctx, 'sandbox', { authority: 4 })

    ctx.console.addListener('sandbox/user', async (name, data) => {
      const users = await this.get()
      if (!users[name]) {
        if (!data) return
        const user = await this.ctx.database.createUser('sandbox', name, {
          authority: 1,
          ...data,
        })
        this.observe(name, user, users)
      } else if (!data) {
        await this.ctx.database.remove('user', users[name].id)
        await this.ctx.database.remove('binding', { platform: 'sandbox', pid: name })
        delete users[name]
        this.ctx.$internal._userCache.set('sandbox', 'sandbox:' + name, null)
      } else {
        Object.assign(users[name], data)
        return users[name].$update()
      }
    }, { authority: 4 })
  }

  observe(name: string, user: User, users: Dict<User.Observed>) {
    users[name] = observe(user, async (diff) => {
      await this.ctx.database.setUser('sandbox', name, diff)
      this.refresh()
    })
    this.ctx.$internal._userCache.set('sandbox', 'sandbox:' + name, users[name])
  }

  async prepare() {
    const data = await this.ctx.database.get('binding', { platform: 'sandbox' }, ['pid', 'aid'])
    const users = await this.ctx.database.get('user', data.map(({ aid }) => aid))
    const result: Dict<User.Observed> = {}
    for (const { aid, pid } of data) {
      const user = users.find(u => u.id === aid)
      if (user) this.observe(pid, user, result)
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

export const filter = false
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

  ctx.platform('sandbox')
    .command('clear')
    .action(({ session }) => {
      session.client.send({
        type: 'sandbox/clear',
      })
    })
}
