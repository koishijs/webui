import { defineExtension } from '@koishijs/client'
import Home from './pages/home.vue'
import App from './layouts/index.vue'
import Layout from './layouts/layout.vue'
import Status from './layouts/status.vue'
import Progress from './layouts/status-loading.vue'

export default defineExtension((ctx) => {
  ctx.page({
    path: '/',
    name: '欢迎',
    icon: 'activity:home',
    order: 1000,
    component: Home,
  })

  ctx.slot({
    type: 'status-right',
    component: Progress,
  })

  ctx.slot({
    type: 'root',
    component: App,
  })

  ctx.slot({
    type: 'layout',
    component: Layout,
  })

  ctx.slot({
    type: 'status',
    component: Status,
  })
})
