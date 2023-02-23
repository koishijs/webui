import { connect, global, root } from '@koishijs/client'
import Instances from './components/instances.vue'
import ClientWebSocket from './socket'
import '@koishijs/client/app'

root.slot({
  type: 'home',
  order: 900,
  component: Instances,
})

global.messages = {}
global.messages.title = 'Koishi Online'
global.messages.connecting = '正在初始化 Koishi Online 运行环境……'

if (!('chrome' in window)) {
  global.messages.unsupported = '您的浏览器不支持 Koishi Online。请使用最新版本的 Chrome 或 Edge。'
} else {
  connect(() => new ClientWebSocket())
}

if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker?.register('/sw.js', { scope: '/' })
}
