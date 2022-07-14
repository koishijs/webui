import { Context } from '@koishijs/client'
import Sandbox from './index.vue'
import './icons'

export default (ctx: Context) => {
  ctx.addPage({
    name: '沙盒',
    path: '/sandbox',
    icon: 'activity:flask',
    order: 300,
    authority: 4,
    component: Sandbox,
  })
}
