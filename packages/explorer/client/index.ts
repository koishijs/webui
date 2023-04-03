import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-explorer/src'
import Layout from './index.vue'
import './icons'
import './editor'

export default (ctx: Context) => {
  ctx.page({
    path: '/files/:name*',
    name: '资源管理器',
    icon: 'activity:explorer',
    order: 600,
    fields: ['explorer'],
    component: Layout,
  })
}
