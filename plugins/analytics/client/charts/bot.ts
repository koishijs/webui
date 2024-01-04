import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

export default (ctx: Context) => {
  ctx.slot({
    type: 'analytic-chart',
    component: createChart({
      title: '各平台消息占比',
      fields: ['analytics'],
      showTab: true,
      options({ analytics }, tab) {
        const data = Object
          .entries(analytics.messageByBot)
          .map(([key, value]) => ({
            name: key,
            children: Object
              .entries(value)
              .map(([key, value]) => ({
                name: value.name || key,
                value: value[tab],
              })),
          }))
        const total = data.reduce((sum, { children }) => {
          return sum + children.reduce((sum, { value }) => sum + value, 0)
        }, 0)
        if (!total) return

        return {
          tooltip: Tooltip.item(({ data }) => {
            return `${data.children ? '平台' : '昵称'}：${data.name}<br>日均消息数量：${+data.value.toFixed(1)}`
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
