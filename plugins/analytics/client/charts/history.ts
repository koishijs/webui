import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

const week = '日一二三四五六'

export default (ctx: Context) => {
  ctx.slot({
    type: 'chart',
    component: createChart({
      title: '历史发言数量',
      fields: ['analytics'],
      options({ analytics }) {
        if (!Object.keys(analytics.messageByDate).length) return

        return {
          tooltip: Tooltip.axis(([{ name, value }]) => {
            const day = new Date(name).getDay()
            return `${name} 星期${week[day]}<br>发言数量：${value}`
          }),
          xAxis: {
            type: 'category',
            data: Object.keys(analytics.messageByDate).reverse(),
          },
          yAxis: {
            type: 'value',
          },
          series: {
            type: 'line',
            smooth: true,
            data: Object.values(analytics.messageByDate).map(stats => stats.send).reverse(),
          },
        }
      },
    }),
  })
}
