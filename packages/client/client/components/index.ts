import { App } from 'vue'
import Markdown from 'marked-vue'
import components from '@koishijs/components'
import Element, { ElLoading, ElMessage, ElMessageBox } from 'element-plus'

import common from './common'
import Dynamic from './dynamic.vue'
import ChatImage from './chat/image.vue'
import * as icons from './icons'
import layout from './layout'
import slot from './slot'

import 'element-plus/dist/index.css'

export const loading = ElLoading.service
export const message = ElMessage
export const messageBox = ElMessageBox

export * from './common'
export * from './layout'
export * from './slot'

export * from 'vue-i18n'
export * from '@koishijs/components'

export { icons, ChatImage }

components.extensions.add({
  type: 'any',
  role: 'dynamic',
  component: Dynamic,
})

export default function (app: App) {
  app.use(Element)
  app.component('k-markdown', Markdown)

  app.use(common)
  app.use(components)
  app.use(icons)
  app.use(layout)
  app.use(slot)
}
