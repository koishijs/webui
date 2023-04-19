import { Component, defineComponent, h } from 'vue'

import misc from './misc'
import outline from './outline'
import solid from './solid'

const registry: Record<string, Component> = {
  ...misc,
  ...outline,
  ...solid,
}

export default defineComponent({
  props: {
    name: String,
  },
  render(props) {
    return props.name ? h(registry[props.name], {
      class: 'market-icon',
    }) : []
  },
})
