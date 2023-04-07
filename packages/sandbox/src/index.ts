import { Context, defineProperty, Random, Schema, User } from 'koishi'
import { Client } from '@koishijs/plugin-console'
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
    'sandbox/user'(this: Client, id: string, data: Partial<User>): Promise<void>
  }
}

export interface Message {
  id: string
  user: string
  channel: string
  content: string
}

export const filter = false
export const name = 'sandbox'
export const using = ['console']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  ctx.plugin(SandboxBot)

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

  function getBot(client: Client) {
    return client.sandbox ||= new SandboxBot(ctx, {
      platform: 'sandbox:' + client.id,
      selfId: 'koishi',
    })
  }

  ctx.console.addListener('sandbox/message', async function (user, channel, content) {
    const bot = getBot(this)
    const id = Random.id()
    ctx.console.broadcast('sandbox', { id, content, user, channel })
    const session = bot.session({
      userId: user,
      content,
      messageId: id,
      channelId: channel,
      guildId: channel === '@' + user ? undefined : channel,
      type: 'message',
      subtype: channel === '@' + user ? 'private' : 'group',
      author: {
        userId: user,
        username: user,
      },
    })
    defineProperty(session, 'client', this)
    bot.dispatch(session)
  }, { authority: 4 })

  ctx.console.addListener('sandbox/user', async function (pid, data) {
    const { platform } = getBot(this)
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

  ctx.on('console/connection', async (client) => {
    if (ctx.console.clients[client.id]) return
    delete ctx.bots[client.sandbox.sid]
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
