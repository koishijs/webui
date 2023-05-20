import { createApp } from 'vue'
import client, { connect, Context, Dict, global, i18n, root, router } from '@koishijs/client'
import App from './layouts/index.vue'
import Home from './pages/home.vue'
import Settings from './pages/settings.vue'
import Progress from './layouts/status-loading.vue'

import './index.scss'

declare module '@koishijs/plugin-console' {
  export interface ClientConfig {
    messages?: Dict<string>
    unsupported?: string[]
  }
}

const app = createApp(App)

app.use(client)
app.use(i18n)
app.use(router)

app.provide('ecTheme', 'dark-blue')

Context.app = app

root.page({
  path: '/',
  name: '欢迎',
  icon: 'activity:home',
  order: 1000,
  component: Home,
})

root.page({
  path: '/settings',
  name: '用户设置',
  icon: 'activity:settings',
  position: 'bottom',
  order: -100,
  component: Settings,
})

root.slot({
  type: 'status-right',
  component: Progress,
})

app.mount('#app')

if (!global.static) {
  const endpoint = new URL(global.endpoint, location.origin).toString()
  connect(() => new WebSocket(endpoint.replace(/^http/, 'ws')))
}
