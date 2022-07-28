import { views } from '..'
import { defineComponent, h } from 'vue'

export default defineComponent({
  props: {
    name: String,
    tag: {
      default: 'div',
    },
  },
  setup: ({ name, tag }, { slots }) => () => {
    return h(tag, [
      ...slots.default?.() || [],
      ...(views[name] || []).map(view => h(view.component)),
    ])
  },
})
