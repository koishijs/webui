import { App } from 'vue'
import Markdown from 'marked-vue'
import components from '@koishijs/components'
import Element, { ElLoading, ElMessage, ElMessageBox } from 'element-plus'

import common from './common'
import ChatImage from './chat/image.vue'
import * as icons from './icons'
import layout from './layout'
import Slot from './slot'

import 'element-plus/dist/index.css'

export const loading = ElLoading.service
export const message = ElMessage
export const messageBox = ElMessageBox

export * from './common'
export * from './layout'

export * from '@koishijs/components'

export { icons, ChatImage }

export default function (app: App) {
  app.use(Element)
  app.component('k-markdown', Markdown)

  app.use(common)
  app.use(components)
  app.use(icons)
  app.use(layout)

  app.component('k-slot', Slot)
}
