import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

const week = '日一二三四五六'

export default (ctx: Context) => {
  ctx.slot({
    type: 'analytic-chart',
    component: createChart({
      title: '历史消息数量',
      fields: ['analytics'],
      showTab: true,
      options({ analytics }, tab) {
        if (!analytics.messageByDate.length) return
        const data = analytics.messageByDate.slice(1)

        return {
          tooltip: Tooltip.axis(([{ name, value }]) => {
            const day = new Date(name).getDay()
            return `${name} 星期${week[day]}<br>消息数量：${value}`
          }),
          xAxis: {
            type: 'category',
            data: data.map((_, index) => new Date(Date.now() - (index + 1) * 86400000).toLocaleDateString('zh-CN')).reverse(),
          },
          yAxis: {
            type: 'value',
          },
          series: {
            type: 'line',
            smooth: true,
            data: data.map(stats => stats[tab]).reverse(),
          },
        }
      },
    }),
  })
}
