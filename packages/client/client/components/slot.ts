import { views } from '..'
import { App, Component, defineComponent, h } from 'vue'

export interface SlotItem {
  order?: number
  component: Component
}

export interface SlotOptions extends SlotItem {
  type: string
}

export const KSlot = defineComponent({
  props: {
    name: String,
    data: Object,
    tag: {
      default: 'div',
    },
  },
  setup(props, { slots }) {
    return () => {
      const internal = [...slots.default?.() || []]
        .filter(node => node.type === KSlotItem)
        .map(node => ({ node, order: node.props?.order || 0 }))
      const external = [...views[props.name] || []]
        .map(item => ({ node: h(item.component, { data: props.data }), order: item.order }))
      const children = [...internal, ...external].sort((a, b) => b.order - a.order)
      return h(props.tag, children.map(item => item.node))
    }
  },
})

const KSlotItem = defineComponent({
  props: {
    order: Number,
  },
  setup(props, { slots }) {
    console.log(111, props, slots)
    return () => slots.default?.()
  },
})

export default (app: App) => {
  app.component('k-slot', KSlot)
  app.component('k-slot-item', KSlotItem)
}
