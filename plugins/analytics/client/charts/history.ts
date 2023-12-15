import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

const week = '日一二三四五六'

export default (ctx: Context) => {
  ctx.slot({
    type: 'chart',
    component: createChart({
      title: '历史消息数量',
      fields: ['analytics'],
      showTab: true,
      options({ analytics }, tab) {
        if (!Object.keys(analytics.messageByDate).length) return

        return {
          tooltip: Tooltip.axis(([{ name, value }]) => {
            const day = new Date(name).getDay()
            return `${name} 星期${week[day]}<br>消息数量：${value}`
          }),
          xAxis: {
            type: 'category',
            data: Object.keys(analytics.messageByDate),
          },
          yAxis: {
            type: 'value',
          },
          series: {
            type: 'line',
            smooth: true,
            data: Object.values(analytics.messageByDate).map(stats => stats[tab]),
          },
        }
      },
    }),
  })
}
