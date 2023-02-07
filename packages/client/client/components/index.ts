import { App } from 'vue'
import Element, { ElLoading, ElMessage, ElMessageBox } from 'element-plus'

import common from './common'
import form from 'schemastery-vue'
import ChatImage from './chat/image.vue'
import * as icons from './icons'
import layout from './layout'
import notice from './notice'
import Slot from './slot'

import 'element-plus/dist/index.css'
import './schema.scss'
import './style.scss'

export const loading = ElLoading.service
export const message = ElMessage
export const messageBox = ElMessageBox

export * from './common'
export * from './layout'
export * from './notice'

export * from 'schemastery-vue'
export * from '@satorijs/components'

export { icons, ChatImage }

export default function (app: App) {
  app.use(Element)

  app.use(common)
  app.use(form)
  app.use(icons)
  app.use(layout)
  app.use(notice)

  app.component('k-slot', Slot)
}
