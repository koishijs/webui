import { App } from 'vue'
import form from 'schemastery-vue'
import Computed from './computed.vue'
import Filter from './k-filter.vue'

form.extensions.add({
  type: 'union',
  role: 'computed',
  component: Computed,
})

export { form as SchemaBase }

export * from 'schemastery-vue'

export default function (app: App) {
  app.use(form)
  app.component('k-filter', Filter)
}
