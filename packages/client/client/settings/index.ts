import { Context } from '..'
import components from '@koishijs/components'
import Settings from './index.vue'
import Theme from './theme.vue'

components.extensions.add({
  type: 'string',
  role: 'theme',
  component: Theme,
})

export default function (ctx: Context) {
  ctx.page({
    path: '/settings/:name*',
    name: '用户设置',
    icon: 'activity:settings',
    position: 'bottom',
    order: -100,
    component: Settings,
  })
}
