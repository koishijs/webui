import { views } from '..'
import { defineComponent, h } from 'vue'

export default defineComponent({
  props: {
    name: String,
    data: Object,
    tag: {
      default: 'div',
    },
  },
  setup: (props, { slots }) => () => {
    return h(props.tag, [
      ...slots.default?.() || [],
      ...(views[props.name] || []).map(view => h(view.component, { data: props.data })),
    ])
  },
})
