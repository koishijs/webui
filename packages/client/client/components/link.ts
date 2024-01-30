import { App, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { useContext } from '../context'

const KActivityLink = defineComponent({
  props: {
    id: String,
  },
  setup(props, { slots }) {
    const ctx = useContext()
    return () => {
      const activity = ctx.$router.pages[props.id]
      return h(RouterLink, {
        to: ctx.$router.cache[activity?.id] || activity?.path.replace(/:.+/, ''),
      }, {
        default: () => slots.default?.() ?? activity?.name,
      })
    }
  },
})

export default function (app: App) {
  app.component('k-activity-link', KActivityLink)
}
