import { views } from '..'
import { App, Component, defineComponent, h } from 'vue'

export interface SlotItem {
  order?: number
  component: Component
}

export interface SlotOptions extends SlotItem {
  type: string
  when?: () => boolean
}

export const KSlot = defineComponent({
  props: {
    name: String,
    data: Object,
    single: Boolean,
  },
  setup(props, { slots }) {
    return () => {
      const internal = props.single ? [] : [...slots.default?.() || []]
        .filter(node => node.type === KSlotItem)
        .map(node => ({ node, order: node.props?.order || 0 }))
      const external = [...views[props.name] || []]
        .filter(item => !item.when || item.when())
        .map(item => ({ node: h(item.component, { data: props.data }), order: item.order, layer: 1 }))
      const children = [...internal, ...external].sort((a, b) => b.order - a.order)
      if (props.single) {
        return children[0]?.node || slots.default?.()
      }
      return children.map(item => item.node)
    }
  },
})

const KSlotItem = defineComponent({
  props: {
    order: Number,
  },
  setup(props, { slots }) {
    return () => slots.default?.()
  },
})

export default (app: App) => {
  app.component('k-slot', KSlot)
  app.component('k-slot-item', KSlotItem)
}
