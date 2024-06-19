import { Context } from '@koishijs/client'
import Settings from './settings.vue'
import Theme from './theme.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/settings/:name*',
    name: '用户设置',
    icon: 'activity:settings',
    position: 'bottom',
    order: -100,
    component: Settings,
  })

  ctx.schema({
    type: 'string',
    role: 'theme',
    component: Theme,
  })

  ctx.settings({
    id: 'status',
    title: '状态栏设置',
    order: 800,
  })

  // ctx.settings({
  //   id: 'activity',
  //   title: '活动栏设置',
  //   order: 800,
  // })
}
