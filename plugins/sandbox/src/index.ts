import { $, Context, Dict, Random, Schema, Universal, User } from 'koishi'
import { DataService } from '@koishijs/console'
import { resolve } from 'path'
import { SandboxBot } from './bot'
import zhCN from './locales/zh-CN.yml'

declare module 'koishi' {
  interface Events {
    'sandbox/response'(nonce: string, data: any): void
  }
}

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      sandbox: SandboxService
    }
  }

  interface Events {
    'sandbox/response'(this: Client, nonce: string, data?: any): void
    'sandbox/send-message'(this: Client, platform: string, user: string, channel: string, content: string, quote?: Message): void
    'sandbox/delete-message'(this: Client, platform: string, user: string, channel: string, messageId: string): void
    'sandbox/get-user'(this: Client, platform: string, pid: string): Promise<User>
    'sandbox/set-user'(this: Client, platform: string, pid: string, data: Partial<User>): Promise<void>
  }
}

export interface Message {
  id: string
  user: string
  channel: string
  content: string
  platform: string
  quote?: Message
}

export const filter = false
export const name = 'sandbox'
export const inject = ['console']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

class SandboxService extends DataService<Dict<number>> {
  static inject = ['database']

  constructor(ctx: Context) {
    super(ctx, 'sandbox')
  }

  async get() {
    const data = await this.ctx.database
      .select('binding')
      .groupBy('platform', {
        count: row => $.count(row.pid),
      })
      .execute()
    return Object.fromEntries(data.map(({ platform, count }) => [platform, count]))
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.plugin(SandboxService)

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

  const bots: Dict<SandboxBot> = {}

  const createEvent = (userId: string, channelId: string) => {
    const isDirect = channelId === '@' + userId
    return {
      user: { id: userId, name: userId },
      channel: { id: channelId, type: isDirect ? Universal.Channel.Type.DIRECT : Universal.Channel.Type.TEXT },
      guild: isDirect ? undefined : { id: channelId },
      timestamp: Date.now(),
    }
  }

  ctx.console.addListener('sandbox/send-message', async function (platform, userId, channel, content, quote) {
    const bot = bots[platform] ||= new SandboxBot(ctx, {
      platform,
      selfId: 'koishi',
    })
    bot.clients.add(this)
    const id = Random.id()
    this.send({
      type: 'sandbox/message',
      body: { id, content, user: userId, channel, platform, quote },
    })
    const session = bot.session(createEvent(userId, channel))
    session.type = 'message'
    session.messageId = id
    session.quote = quote && {
      content: quote.content,
      id: quote.id,
    }
    session.content = content
    bot.dispatch(session)
  }, { authority: 4 })

  ctx.console.addListener('sandbox/delete-message', async function (platform, userId, channel, messageId) {
    const bot = bots[platform] ||= new SandboxBot(ctx, {
      platform,
      selfId: 'koishi',
    })
    bot.clients.add(this)
    const session = bot.session(createEvent(userId, channel))
    session.type = 'message-deleted'
    session.messageId = messageId
    bot.dispatch(session)
  }, { authority: 4 })

  ctx.console.addListener('sandbox/get-user', async function (platform, pid) {
    if (!ctx.database) return
    const [binding] = await ctx.database.get('binding', { platform, pid }, ['aid'])
    if (binding) return ctx.database.getUser(platform, pid)
    return ctx.database.createUser(platform, pid, {
      authority: 1,
    })
  }, { authority: 4 })

  ctx.console.addListener('sandbox/set-user', async function (platform, pid, data) {
    if (!ctx.database) return
    const [binding] = await ctx.database.get('binding', { platform, pid }, ['aid'])
    if (!binding) {
      if (!data) return
      await ctx.database.createUser(platform, pid, {
        authority: 1,
        ...data,
      })
    } else if (!data) {
      await ctx.database.remove('user', binding.aid)
      await ctx.database.remove('binding', { platform, pid })
    } else {
      await ctx.database.upsert('user', [{
        id: binding.aid,
        ...data,
      }])
    }
  }, { authority: 4 })

  ctx.console.addListener('sandbox/response', (nonce, data) => {
    ctx.emit('sandbox/response', nonce, data)
  }, { authority: 4 })

  ctx.on('console/connection', async (client) => {
    if (ctx.console.clients[client.id]) return
    for (const platform of Object.keys(bots)) {
      const bot = bots[platform]
      bot.clients.delete(client)
      if (!bot.clients.size) {
        delete bots[platform]
        delete ctx.bots[bot.sid]
      }
    }
  })

  ctx.i18n.define('zh-CN', zhCN)

  ctx.intersect(session => session.platform.startsWith('sandbox:'))
    .command('clear')
    .action(({ session }) => {
      for (const client of (session.bot as SandboxBot).clients) {
        client.send({
          type: 'sandbox/clear',
        })
      }
    })
}
