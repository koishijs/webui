import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { BarChart, LineChart, PieChart, SunburstChart } from 'echarts/charts'
import VChart from 'vue-echarts'

use([BarChart, CanvasRenderer, GridComponent, LineChart, TooltipComponent, PieChart, SunburstChart])

export default VChart
