import { Context } from '@koishijs/client'
import Chat from './chat.vue'
import './icons'

export default (ctx: Context) => {
  ctx.addPage({
    path: '/chat',
    name: '聊天',
    icon: 'activity:comments',
    authority: 3,
    component: Chat,
    order: 100,
  })
}
