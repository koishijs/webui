import { Context, Dict, h, MessageEncoder, Random } from 'koishi'
import FileType from 'file-type'
import {} from '@koishijs/assets'
import { SandboxBot } from './bot'

export class SandboxMessenger<C extends Context = Context> extends MessageEncoder<C, SandboxBot<C>> {
  private buffer = ''

  private rules: Dict<h.Transformer> = Object.fromEntries(['image', 'img', 'audio', 'video', 'file'].map((type) => {
    return [type, async (attrs) => {
      const src = attrs.src || attrs.url
      const type1 = type === 'image' ? 'img' : type
      if (src.startsWith('base64://')) {
        const { mime } = await FileType.fromBuffer(Buffer.from(src.slice(9), 'base64'))
        return h(type1, { ...attrs, src: `data:${mime};base64,${src.slice(9)}` })
      } else if (src.startsWith('file:') && this.bot.ctx.assets) {
        return h(type1, { ...attrs, src: await this.bot.ctx.assets.upload(src, src) })
      }
      return h(type1, { ...attrs, src })
    }]
  }))

  async flush() {
    if (!this.buffer.trim()) return
    const content = await h.transformAsync(this.buffer.trim(), this.rules)
    const session = this.bot.session(this.session.event)
    session.messageId = Random.id()
    for (const client of this.bot.clients) {
      client.send({
        type: 'sandbox/message',
        body: {
          content,
          user: 'Koishi',
          channel: session.channelId,
          id: session.messageId,
          platform: session.platform,
        },
      })
    }
    this.results.push(session.event.message)
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
