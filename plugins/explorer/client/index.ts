import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-explorer/src'
import './icons'
import './editor'
// import FilePicker from './file-picker.vue'
// import Layout from './index.vue'
// import Status from './status.vue'
const FilePicker = () => import('./file-picker.vue')
const Layout = () => import('./index.vue')
const Status = () => import('./status.vue')

Context.app.component('k-file-picker', FilePicker)

export default (ctx: Context) => {
  ctx.schema({
    type: 'string',
    role: 'path',
    component: FilePicker,
    validate: value => typeof value === 'string',
  })

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
