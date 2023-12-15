import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

export default (ctx: Context) => {
  ctx.slot({
    type: 'chart',
    component: createChart({
      title: '指令调用频率',
      fields: ['analytics'],
      options({ analytics }) {
        const data = Object.entries(analytics.commandRate)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }))
        if (!data.length) return

        return {
          tooltip: Tooltip.item(({ data }) => {
            const output = [data.name]
            output.push(`日均调用：${data.value.toFixed(2)}`)
            return output.join('<br>')
          }),
          series: [{
            type: 'pie',
            data,
            radius: ['35%', '65%'],
            minShowLabelAngle: 3,
          }],
        }
      },
    }),
  })
}
