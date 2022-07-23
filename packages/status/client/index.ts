import { Card, defineExtension } from '@koishijs/client'
import {} from '@koishijs/plugin-status/src'
import Charts from './charts'
import Bots from './bots'
import Load from './load'
import './icons'

export default defineExtension((ctx) => {
  ctx.plugin(Charts)
  ctx.plugin(Bots)
  ctx.plugin(Load)

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '近期消息频率',
      icon: 'history',
      fields: ['stats'],
      content({ stats }) {
        return Object.values(stats.botSend).reduce((sum, value) => sum + value, 0).toFixed(1) + ' / d'
      },
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '资源服务器',
      icon: 'storage',
      type: 'size',
      fields: ['meta'],
      content: ({ meta }) => meta.assetSize,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '活跃用户数量',
      icon: 'heart',
      fields: ['meta'],
      content: ({ meta }) => meta.activeUsers,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '活跃群组数量',
      icon: 'users',
      fields: ['meta'],
      content: ({ meta }) => meta.activeGuilds,
    }),
  })
})
