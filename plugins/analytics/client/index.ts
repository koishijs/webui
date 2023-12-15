import { Card, defineExtension } from '@koishijs/client'
import {} from '@koishijs/plugin-analytics/src'
import Charts from './charts'
import './icons'

export default defineExtension((ctx) => {
  ctx.plugin(Charts)

  // 用户数量 群组数量 周均 DAU 当前 QPS
  // 昨日新增用户 昨日新增群组 昨日 DAU 昨日 QPS

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '用户数量',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.userCount,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '群组数量',
      icon: 'users',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.guildCount,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '昨日用户增量',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.userIncrement,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: Card.numeric({
      title: '昨日群组增量',
      icon: 'users',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.guildIncrement,
    }),
  })
})
