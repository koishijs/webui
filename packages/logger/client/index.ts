import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-logger'
import Logs from './index.vue'
import './index.scss'
import './icons'

export default (ctx: Context) => {
  ctx.addPage({
    path: '/logs',
    name: '日志',
    icon: 'activity:logs',
    order: 0,
    authority: 4,
    fields: ['logs'],
    component: Logs,
  })
}
