import { Context } from '@koishijs/client'
import type {} from '@koishijs/plugin-config'
import Settings from './components/index.vue'
import Select from './components/select.vue'
import './icons'

export * from './components/utils'

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
    fields: ['config', 'packages', 'services'],
    component: Settings,
  })
}
