import { Context, icons } from '@koishijs/client'
import {} from '@koishijs/plugin-commands'
import Activity from './icons/activity.vue'
import Commands from './commands.vue'
import Locales from './locales.vue'
import Settings from './settings.vue'

icons.register('activity:commands', Activity)

export default (ctx: Context) => {
  ctx.page({
    path: '/commands/:name*',
    name: '指令管理',
    icon: 'activity:commands',
    order: 500,
    authority: 4,
    fields: ['commands'],
    component: Commands,
  })

  ctx.slot({
    type: 'market-settings',
    component: Settings,
    order: 2000,
  })

  ctx.slot({
    type: 'locale-main',
    component: Locales,
    order: 1000,
  })
}
