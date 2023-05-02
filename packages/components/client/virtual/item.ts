import { Comment, defineComponent, Directive, Fragment, h, Ref, ref, Text, VNode, watch, withDirectives } from 'vue'

export const useRefDirective = (ref: Ref): Directive<Element> => ({
  mounted(el) {
    ref.value = el
  },
  updated(el) {
    ref.value = el
  },
  beforeUnmount() {
    ref.value = null
  },
})

function findFirstLegitChild(node: VNode[]): VNode {
  if (!node) return null
  for (const child of node) {
    if (typeof child === 'object') {
      switch (child.type) {
        case Comment:
          continue
        case Text:
          break
        case Fragment:
          return findFirstLegitChild(child.children as VNode[])
        default:
          if (typeof child.type === 'string') return child
          return child
      }
    }
    return h('span', child)
  }
}

const VirtualItem = defineComponent({
  props: {
    class: {},
  },

  emits: ['resize'],

  setup(props, { attrs, slots, emit }) {
    let resizeObserver: ResizeObserver
    const root = ref<HTMLElement>()

    watch(root, (value) => {
      resizeObserver?.disconnect()
      if (!value) return

      resizeObserver = new ResizeObserver(dispatchSizeChange)
      resizeObserver.observe(value)
    })

    function dispatchSizeChange() {
      if (!root.value) return
      const marginTop = +(getComputedStyle(root.value).marginTop.slice(0, -2))
      emit('resize', root.value.offsetHeight + marginTop)
    }

    const directive = useRefDirective(root)

    return () => {
      const head = findFirstLegitChild(slots.default?.(attrs))
      return withDirectives(head, [[directive]])
    }
  },
})

export default VirtualItem
