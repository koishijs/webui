import { Context, message } from '@koishijs/client'
import {} from '@koishijs/plugin-notifier/src'
import Config from './config.vue'

import 'virtual:uno.css'

interface NotifierMessage {
  content: string
  type: 'success' | 'warning' | 'error' | 'primary'
}

declare module '@koishijs/client' {
  interface Events<C> {
    'notifier/message'(this: C, payload: NotifierMessage): void
  }
}

export default (ctx: Context) => {
  ctx.slot({
    type: 'plugin-details',
    component: Config,
    order: 0,
  })

  ctx.on('notifier/message', ({ content, type }) => {
    ctx.effect(() => {
      const handler = message({
        message: content,
        type: type === 'primary' ? 'info' : type,
      })
      return () => handler.close()
    })
  })
}
