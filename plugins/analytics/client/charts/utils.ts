import { defineAsyncComponent, defineComponent, h, ref, resolveComponent } from 'vue'
import { Field, Store, store } from '@koishijs/client'
import type * as echarts from 'echarts'
import './index.scss'

const VChart = defineAsyncComponent(() => import('./echarts'))

export interface ChartOptions {
  title: string
  fields?: Field[]
  showTab?: boolean
  options: (store: Store, tab: 'send' | 'receive') => echarts.EChartsOption
}

const tabValue = ref<'send' | 'receive'>('send')

export function createChart({ title, fields, showTab, options }: ChartOptions) {
  return defineComponent({
    render: () => {
      if (!fields.every(key => store[key])) return null
      const option = options(store, tabValue.value)
      if (!option) return
      return h(resolveComponent('k-card'), { class: 'frameless analytics-card' }, {
        header: () => [
          h('span', { class: 'left' }, [title]),
          ...showTab ? [h('span', { class: 'right' }, [
            h('span', {
              class: 'tab-item' + (tabValue.value === 'send' ? ' active' : ''),
              onClick: () => tabValue.value = 'send',
            }, ['发送']),
            h('span', {
              class: 'tab-item' + (tabValue.value === 'receive' ? ' active' : ''),
              onClick: () => tabValue.value = 'receive',
            }, ['接收']),
          ])] : [],
        ],
        default: () => {
          return h(VChart, { option, autoresize: true })
        },
      })
    },
  })
}

interface CommonData {
  name: string
  value: number
  children?: CommonData
}

export namespace Tooltip {
  type FormatterCallback<T> = (params: T) => string
  type FormatterCallbackParams<T> = Omit<echarts.DefaultLabelFormatterCallbackParams, 'data'> & { data: T }

  export const item = <T = CommonData>(formatter: FormatterCallback<FormatterCallbackParams<T>>) => ({
    trigger: 'item',
    formatter,
  } as echarts.TooltipComponentOption)

  export const axis = <T = CommonData>(formatter: FormatterCallback<FormatterCallbackParams<T>[]>) => ({
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
    formatter,
  } as echarts.TooltipComponentOption)
}
