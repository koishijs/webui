import { App } from 'vue'
import Button from './k-button.vue'
import Tab from './k-tab.vue'

export default function (app: App) {
  app.component('k-button', Button)
  app.component('k-tab', Tab)
}
