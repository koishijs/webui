import { Context } from '@koishijs/client'
import Home from './pages/home.vue'
import App from './layouts/index.vue'
import Layout from './layouts/layout.vue'
import Status from './layouts/status.vue'
import Progress from './layouts/status-loading.vue'

import './styles/index.scss'

export default function (ctx: Context) {
  ctx.theme({
    id: 'default-light',
    name: 'Default Light',
  })

  ctx.theme({
    id: 'default-dark',
    name: 'Default Dark',
  })

  ctx.theme({
    id: 'hc-light',
    name: 'High Contrast Light',
  })

  ctx.theme({
    id: 'hc-dark',
    name: 'High Contrast Dark',
  })

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
    order: -1000,
  })

  ctx.slot({
    type: 'layout',
    component: Layout,
    order: -1000,
  })

  ctx.slot({
    type: 'status',
    component: Status,
    order: -1000,
  })
}
