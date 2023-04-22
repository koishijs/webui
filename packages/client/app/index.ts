import { createApp } from 'vue'
import { useDark } from '@vueuse/core'
import client, { connect, Context, Dict, global, root, router } from '@koishijs/client'
import App from './layouts/index.vue'
import Home from './layouts/home.vue'
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

app.provide('ecTheme', 'dark-blue')

Context.app = app

root.page({
  path: '/',
  name: '欢迎',
  icon: 'activity:home',
  order: 1000,
  component: Home,
})

root.slot({
  type: 'status-right',
  component: Progress,
})

const isDark = useDark()

root.page({
  id: 'dark-mode',
  position: 'bottom',
  order: -100,
  name: () => isDark.value ? '暗黑模式' : '明亮模式',
  icon: () => 'activity:' + (isDark.value ? 'moon' : 'sun'),
  action: () => isDark.value = !isDark.value,
})

app.use(router)

app.mount('#app')

if (!global.static) {
  const endpoint = new URL(global.endpoint, location.origin).toString()
  connect(() => new WebSocket(endpoint.replace(/^http/, 'ws')))
}
