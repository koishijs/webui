import { Context } from '@koishijs/client'
import Sandbox from './layout.vue'
import './icons'

import 'virtual:uno.css'

export default (ctx: Context) => {
  ctx.page({
    name: '沙盒',
    path: '/sandbox',
    icon: 'activity:flask',
    order: 300,
    authority: 4,
    component: Sandbox,
  })

  ctx.menu('sandbox.message', [{
    id: '.delete',
    label: '删除消息',
  }, {
    id: '.quote',
    label: '引用回复',
  }])
}
