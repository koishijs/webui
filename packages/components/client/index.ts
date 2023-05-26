import { App } from 'vue'
import form from './form'
import virtual from './virtual'
import Comment from './k-comment.vue'

export * from 'cosmokit'
export * from './chat'
export * from './form'
export * from './virtual'

export default function (app: App) {
  app.use(form)
  app.use(virtual)
  app.component('k-comment', Comment)
}
