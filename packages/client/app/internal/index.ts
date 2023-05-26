import { Context } from '@koishijs/client'
import Appearance from './appearance.vue'
import General from './general.vue'
import Settings from './index.vue'
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

  ctx.extendSettings({
    key: '',
    title: '通用设置',
    component: General,
  })

  ctx.extendSettings({
    key: 'appearance',
    title: '外观设置',
    component: Appearance,
  })
}
