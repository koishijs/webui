import { Context } from '@koishijs/client'
import { createChart } from './utils'

export default (ctx: Context) => {
  ctx.slot({
    type: 'chart',
    component: createChart({
      title: '各平台消息数量',
      fields: ['analytics'],
      options({ analytics }) {
        if (!Object.keys(analytics.messageByBot).length) return
        const platformData = Object
          .entries(analytics.messageByBot)
          .map(([key, value]) => ({
            name: key,
            value: Object.values(value).reduce((a, b) => a + b.send, 0),
          }))
          .sort((a, b) => b.value - a.value)
        const botData = platformData.flatMap(({ name }) => {
          return Object
            .entries(analytics.messageByBot[name])
            .map(([key, value]) => ({
              name: key,
              platform: name,
              value: value.send,
            }))
            .sort((a, b) => b.value - a.value)
        })

        return {
          series: [{
            type: 'pie',
            data: platformData,
            radius: ['0%', '35%'],
            minShowLabelAngle: 3,
          }, {
            type: 'pie',
            data: botData,
            radius: ['35%', '65%'],
            minShowLabelAngle: 3,
          }],
        }
      },
    }),
  })
}
