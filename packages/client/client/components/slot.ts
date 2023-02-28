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
  setup: ({ name, data, tag }, { slots }) => () => {
    return h(tag, [
      ...slots.default?.() || [],
      ...(views[name] || []).map(view => h(view.component, data)),
    ])
  },
})
