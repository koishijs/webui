import { defineExtension } from '@koishijs/client'
import { createNumeric } from './utils'
import {} from '@koishijs/plugin-analytics/src'

export default defineExtension((ctx) => {
  // 用户数量 群组数量 周均 DAU 当前 QPS
  // 昨日新增用户 昨日新增群组 昨日 DAU 昨日 QPS

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '用户数量',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.userCount,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '群组数量',
      icon: 'users',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.guildCount,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '今日 DAU',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.dauHistory[0],
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '当前 QPS',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.messageByHour[0].receive / 60,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '昨日用户增量',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.userIncrement,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '昨日群组增量',
      icon: 'users',
      fields: ['analytics'],
      content: ({ analytics }) => analytics.guildIncrement,
    }),
  })

  ctx.slot({
    type: 'numeric',
    component: createNumeric({
      title: '上周 DAU',
      icon: 'heart',
      fields: ['analytics'],
      content: ({ analytics }) => (analytics.dauHistory.slice(1).reduce((a, b) => a + b, 0) / 7).toFixed(1),
    }),
  })
})
