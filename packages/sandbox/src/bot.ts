import { Bot, Context, defineProperty, Dict, Fragment, h, Messenger, Random, SendOptions } from 'koishi'
import {} from '@koishijs/assets'

class SandboxMessenger extends Messenger<SandboxBot> {
  private buffer = ''

  private rules: Dict<h.AsyncTransformer> = Object.fromEntries(['image', 'audio', 'video', 'file'].map((type) => {
    return [type, async (data) => {
      if (data.url.startsWith('file:') && this.bot.ctx.assets) {
        return h(type, { ...data, url: await this.bot.ctx.assets.upload(data.url, data.url) })
      }
      return h(type, data)
    }]
  }))

  async flush() {
    if (!this.buffer.trim()) return
    const content = await h.transformAsync(this.buffer.trim(), this.rules)
    const session = this.bot.session(this.session)
    session.messageId = Random.id()
    session.app.console.broadcast('sandbox', {
      content,
      user: 'Koishi',
      channel: session.channelId,
      id: session.messageId,
    })
    this.results.push(session)
    this.buffer = ''
  }

  async visit(element: h) {
    const { type, children } = element
    if (type === 'message' || type === 'figure') {
      await this.flush()
      await this.render(children)
      await this.flush()
    } else {
      this.buffer += element.toString()
    }
  }
}

export class SandboxBot extends Bot {
  username = 'koishi'
  hidden = true
  internal = {}

  constructor(public ctx: Context) {
    super(ctx, {
      platform: 'sandbox',
      selfId: 'koishi',
    })

    const self = this
    ctx.console.addListener('sandbox/message', async function (user, channel, content) {
      const id = Random.id()
      ctx.console.broadcast('sandbox', { id, content, user, channel })
      const session = self.session({
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
      defineProperty(session, 'handle', this)
      self.dispatch(session)
    }, { authority: 4 })
  }

  async sendMessage(channelId: string, fragment: Fragment, guildId?: string, options?: SendOptions) {
    return new SandboxMessenger(this, channelId, guildId, options).send(fragment)
  }

  async sendPrivateMessage(userId: string, fragment: Fragment, options?: SendOptions) {
    return new SandboxMessenger(this, '@' + userId, undefined, options).send(fragment)
  }

  async deleteMessage(channelId: string, messageId: string) {
    this.ctx.console.broadcast('sandbox/delete', { id: messageId, channel: channelId })
  }

  async getGuildMemberList(guildId: string) {
    return words.map((word) => ({
      nickname: word,
      userId: word,
    }))
  }
}

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]
