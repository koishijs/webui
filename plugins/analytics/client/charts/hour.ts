import { Context } from '@koishijs/client'
import { createChart, Tooltip } from './utils'

const formatHour = (value: number) => `${(value - 0.5).toFixed()}:00-${(value + 0.5).toFixed()}:00`

export default (ctx: Context) => {
  ctx.slot({
    type: 'chart',
    component: createChart({
      title: '每小时发言数量',
      fields: ['analytics'],
      options({ analytics }) {
        return {
          tooltip: Tooltip.axis<number[]>((params) => {
            const [{ data: [x], dataIndex }] = params
            const source = analytics.messageByHour[dataIndex]
            const output = [
              `${formatHour(x)}`,
              `消息总量：${+(source.send || 0).toFixed(1)}`,
            ]
            return output.join('<br>')
          }),
          xAxis: {
            type: 'value',
            min: 0,
            max: 24,
            minInterval: 1,
            maxInterval: 4,
            axisLabel: {
              formatter: value => value + ':00',
            },
            axisPointer: {
              label: {
                formatter: ({ value }) => formatHour(value as number),
              },
            },
          },
          yAxis: {
            type: 'value',
          },
          series: [{
            name: '其他',
            data: analytics.messageByHour.map((val, index) => [index + 0.5, val.send || 0]),
            type: 'bar',
            stack: '1',
          }],
        }
      },
    }),
  })
}
