import { Bot, Context, defineProperty, Fragment, Messenger, Random, segment } from 'koishi'

class SandboxMessenger extends Messenger<SandboxBot> {
  private buffer = ''

  async flush() {
    if (!this.buffer.trim()) return
    const content = await segment.transformAsync(this.buffer.trim(), {
      image: async (data) => {
        if (data.url.startsWith('file://') && process.env.KOISHI_ENV !== 'browser') {
          const file = await this.bot.ctx.http.file(data.url)
          return segment.image(`data:${file.mime};base64,` + Buffer.from(file.data).toString('base64'))
        }
        // for backward compatibility
        if (!data.url.startsWith('base64://')) return segment('image', data)
        return segment.image('data:image/png;base64,' + data.url.slice(9))
      },
    })
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

  async visit(element: segment) {
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

  async sendMessage(channelId: string, fragment: Fragment, guildId?: string) {
    return new SandboxMessenger(this, channelId, guildId).send(fragment)
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
