import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

export default (ctx: Context) => {
  ctx.slot({
    type: 'chart',
    component: createChart({
      title: '各平台占比',
      fields: ['analytics'],
      options({ analytics }) {
        if (!Object.keys(analytics.messageByBot).length) return
        const data = Object
          .entries(analytics.messageByBot)
          .map(([key, value]) => ({
            name: key,
            children: Object
              .entries(value)
              .map(([key, value]) => ({
                name: value.name || key,
                value: value.send,
              })),
          }))

        return {
          tooltip: Tooltip.item(({ data }) => {
            return `${data.children ? '平台' : '昵称'}：${data.name}<br>消息数量：${data.value.toFixed(2)}`
          }),
          series: [{
            type: 'sunburst',
            data,
            radius: ['0', '65%'],
            nodeClick: false,
            emphasis: {
              focus: 'ancestor',
            },
            levels: [{}, {
              label: {
                rotate: 'tangential',
              },
            }, {
              label: {
                position: 'outside',
                padding: 3,
                silent: false,
              },
            }],
          }],
        }
      },
    }),
  })
}
