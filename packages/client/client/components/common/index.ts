import { App } from 'vue'
import Button from './k-button.vue'
import Filter from './k-filter.vue'
import FilterButton from './k-filter-button.vue'
import Form from './k-form.vue'
import Tab from './k-tab.vue'

export default function (app: App) {
  app.component('k-button', Button)
  app.component('k-filter', Filter)
  app.component('k-filter-button', FilterButton)
  app.component('k-form', Form)
  app.component('k-tab', Tab)
}
