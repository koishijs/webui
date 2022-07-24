import { App } from 'vue'
import Button from './k-button.vue'
import Form from './k-form.vue'
import Tab from './k-tab.vue'

export default function (app: App) {
  app.component('k-button', Button)
  app.component('k-form', Form)
  app.component('k-tab', Tab)
}
