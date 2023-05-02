import { App } from 'vue'
import VirtualList from './list.vue'

export { VirtualList }

export default function (app: App) {
  app.component('virtual-list', VirtualList)
}
