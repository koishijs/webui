import { App, defineComponent, h, resolveComponent } from 'vue'
import { useContext } from '../context'

const KActivityLink = defineComponent({
  props: {
    id: String,
  },
  setup(props, { slots }) {
    const ctx = useContext()
    return () => {
      const activity = ctx.internal.activities[props.id]
      return h(resolveComponent('router-link') as any, {
        to: ctx.internal.routeCache[activity?.id] || activity?.path.replace(/:.+/, ''),
      }, {
        default: () => slots.default?.() ?? activity?.name,
      })
    }
  },
})

export default function (app: App) {
  app.component('k-activity-link', KActivityLink)
}
