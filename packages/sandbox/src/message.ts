import { Dict, h, Messenger, Random } from 'koishi'
import { fromBuffer } from 'file-type'
import {} from '@koishijs/assets'
import { SandboxBot } from './bot'

export class SandboxMessenger extends Messenger<SandboxBot> {
  private buffer = ''

  private rules: Dict<h.Transformer> = Object.fromEntries(['image', 'audio', 'video', 'file'].map((type) => {
    return [type, async (data) => {
      if (data.url.startsWith('base64://')) {
        const { mime } = await fromBuffer(Buffer.from(data.url.slice(9), 'base64'))
        return h(type, { ...data, url: `data:${mime};base64,${data.url.slice(9)}` })
      } else if (data.url.startsWith('file:') && this.bot.ctx.assets) {
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
    session.app.console.broadcast('sandbox/message', {
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
