import { Context } from '@koishijs/client'
import type {} from '@koishijs/plugin-config'
import Settings from './components/index.vue'
import SettingsModifier from './components/slots/modifier.vue'
import SettingsUsage from './components/slots/usage.vue'
import Select from './components/select.vue'
import './icons'

export default (ctx: Context) => {
  ctx.slot({
    type: 'global',
    component: Select,
  })

  ctx.page({
    path: '/plugins/:name*',
    name: '插件配置',
    icon: 'activity:plugin',
    order: 800,
    authority: 4,
    fields: ['config', 'packages'],
    component: Settings,
  })

  ctx.slot({
    type: 'market-settings',
    component: SettingsUsage,
    order: -500,
  })

  ctx.slot({
    type: 'market-settings',
    component: SettingsModifier,
    order: -1000,
  })
}
