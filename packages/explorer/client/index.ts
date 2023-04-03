import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-explorer/src'
import Layout from './index.vue'
import './icons'

export default (ctx: Context) => {
  ctx.page({
    path: '/files',
    name: '资源管理器',
    icon: 'activity:explorer',
    order: 600,
    fields: ['explorer'],
    component: Layout,
  })
}
