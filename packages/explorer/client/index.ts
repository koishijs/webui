import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-explorer/src'
import FilePicker from './file-picker.vue'
import Layout from './index.vue'
import Status from './status.vue'
import './icons'
import './editor'

Context.app.component('k-file-picker', FilePicker)

export default (ctx: Context) => {
  ctx.page({
    path: '/files/:name*',
    name: '资源管理器',
    icon: 'activity:explorer',
    order: 600,
    fields: ['explorer'],
    component: Layout,
  })

  ctx.slot({
    type: 'status-right',
    component: Status,
  })
}
