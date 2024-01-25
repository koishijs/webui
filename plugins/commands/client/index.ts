import { Context, icons } from '@koishijs/client'
import {} from '@koishijs/plugin-commands'
import Activity from './icons/activity.vue'
import Check from './icons/check.vue'
import TrashCan from './icons/trash-can.vue'
import Commands from './commands.vue'
import Locales from './locales.vue'
import Settings from './settings.vue'

import 'virtual:uno.css'

icons.register('activity:commands', Activity)
icons.register('check', Check)
icons.register('trash-can', TrashCan)

export default (ctx: Context) => {
  ctx.page({
    path: '/commands/:name*',
    name: '指令管理',
    icon: 'activity:commands',
    order: 500,
    authority: 4,
    component: Commands,
  })

  ctx.slot({
    type: 'plugin-details',
    component: Settings,
    order: 200,
  })

  ctx.slot({
    type: 'locale-main',
    component: Locales,
    order: 1000,
  })

  ctx.menu('command', [{
    id: '.update',
    icon: 'save',
    label: '保存更改',
  }, {
    id: '.remove',
    icon: 'trash-can',
    label: '移除指令',
  }, {
    id: '.create',
    icon: 'add',
    label: '创建指令',
  }])
}
