import { Card, Context } from '@koishijs/client'
import type {} from '@koishijs/plugin-manager'
import Settings from './settings/index.vue'
import Dependencies from './deps/index.vue'
import Market from './market/index.vue'
import { overrideCount } from './utils'
import './icons'

export default (ctx: Context) => {
  ctx.addView({
    type: 'numeric',
    order: 100,
    component: Card.numeric({
      title: '当前消息频率',
      icon: 'paper-plane',
      fields: ['bots'],
      content: ({ bots }) => Object.values(bots).reduce((sum, bot) => sum + bot.messageSent, 0) + ' / min',
    }),
  })

  ctx.addPage({
    path: '/plugins/:name*',
    name: '插件配置',
    icon: 'activity:plugin',
    order: 630,
    authority: 4,
    fields: ['config', 'packages', 'dependencies'],
    component: Settings,
  })

  ctx.addPage({
    path: '/market',
    name: '插件市场',
    icon: 'activity:market',
    order: 620,
    authority: 4,
    fields: ['config', 'market', 'packages'],
    component: Market,
  })

  ctx.addPage({
    path: '/dependencies',
    name: '依赖管理',
    icon: 'activity:deps',
    order: 610,
    authority: 4,
    fields: ['market', 'dependencies'],
    component: Dependencies,
    badge: () => overrideCount.value,
  })
}
