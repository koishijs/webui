import { createApp } from 'vue'
import { useDark } from '@vueuse/core'
import client, { config, connect, root, router } from '@koishijs/client'
import App from './layouts/index.vue'
import Home from './layouts/home.vue'
import FrontWebSocket from './play'

import './index.scss'

const app = createApp(App)

app.use(client)

app.provide('ecTheme', 'dark-blue')

root.page({
  path: '/',
  name: '欢迎',
  icon: 'activity:home',
  order: 1000,
  component: Home,
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

router.afterEach((route) => {
  if (typeof route.name === 'string') {
    document.title = `${route.name} | Koishi 控制台`
  }
})

app.mount('#app')

if (config.static) {
  connect(new FrontWebSocket())
} else {
  const endpoint = new URL(config.endpoint, location.origin).toString()
  connect(new WebSocket(endpoint.replace(/^http/, 'ws')))
}
