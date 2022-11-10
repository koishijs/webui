import { Bot, Context, defineProperty, Dict, Fragment, observe, Random, Schema, segment, User } from 'koishi'
import { DataService, SocketHandle } from '@koishijs/plugin-console'
import { resolve } from 'path'
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
      users: UserProvider
    }
  }
}

class SandboxBot extends Bot {
  username = 'koishi'
  hidden = true

  constructor(public ctx: Context) {
    super(ctx, {
      platform: 'sandbox',
      selfId: 'koishi',
    })

    const self = this
    ctx.console.addListener('sandbox/message', async function (user, channel, content) {
      ctx.console.broadcast('sandbox', { content, user, channel })
      const session = self.session({
        userId: user,
        content,
        channelId: channel,
        guildId: channel === '@' + user ? undefined : channel,
        type: 'message',
        subtype: channel === '@' + user ? 'private' : 'group',
        author: {
          userId: user,
          username: user,
        },
      })
      defineProperty(session, 'handle', this)
      self.dispatch(session)
    }, { authority: 4 })
  }

  async sendMessage(channel: string, content: Fragment) {
    const elements = segment.normalize(content)
    const ids: string[] = []

    let buffer = ''
    const flush = () => {
      if (!buffer.trim()) return
      content = segment.transform(buffer.trim(), {
        image(data) {
          // for backward compatibility
          if (!data.url.startsWith('base64://')) return segment('image', data)
          return segment.image('data:image/png;base64,' + data.url.slice(9))
        },
      })
      this.ctx.console.broadcast('sandbox', { content, user: 'Koishi', channel })
      ids.push(Random.id())
      buffer = ''
    }

    const render = (elements: segment[]) => {
      for (const element of elements) {
        const { type, children } = element
        if (type === 'message') {
          flush()
          render(children)
          flush()
        } else {
          buffer += element.toString()
        }
      }
    }
    render(elements)
    flush()
    return ids
  }

  async getGuildMemberList(guildId: string) {
    return words.map((word) => ({
      nickname: word,
      userId: word,
    }))
  }
}

export interface Message {
  user: string
  channel: string
  content: string
}

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]

export class UserProvider extends DataService<Dict<User>> {
  static using = ['database'] as const
  private task: Promise<Dict<User.Observed>>

  constructor(ctx: Context) {
    super(ctx, 'users', { authority: 4 })

    ctx.console.addListener('sandbox/user', async (name, data) => {
      const users = await this.get()
      if (!users[name]) {
        if (!data) return
        const user = await this.ctx.database.createUser('sandbox', name, {
          authority: 1,
          ...data,
        })
        return this.observe(user, users)
      } else if (!data) {
        delete users[name]
        this.ctx.$internal._userCache.set('sandbox', 'sandbox:' + name, null)
        return this.ctx.database.remove('user', { sandbox: name })
      }
      Object.assign(users[name], data)
      return users[name].$update()
    }, { authority: 4 })
  }

  observe(user: User, users: Dict<User.Observed>) {
    const uid = 'sandbox:' + user.sandbox
    users[user.sandbox] = observe(user, async (diff) => {
      await this.ctx.database.setUser('sandbox', user.sandbox, diff)
      this.refresh()
    })
    this.ctx.$internal._userCache.set('sandbox', uid, users[user.sandbox])
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
