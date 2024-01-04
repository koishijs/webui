import { connect, global, icons, root } from '@koishijs/client'
import IconDocs from './icons/docs.vue'
import IconForum from './icons/forum.vue'
import IconInstances from './icons/instances.vue'
import IconShare from './icons/share.vue'
import Home from './components/home.vue'
import Instances from './components/instances.vue'
import ClientWebSocket from './socket'
import '@koishijs/client/app'

icons.register('activity:docs', IconDocs)
icons.register('activity:forum', IconForum)
icons.register('activity:instances', IconInstances)
icons.register('share', IconShare)

root.page({
  id: 'home',
  path: '/',
  name: '欢迎',
  icon: 'activity:home',
  order: 1000,
  component: Home,
})

root.page({
  id: 'instances',
  path: '/instances',
  name: '实例管理',
  icon: 'activity:instances',
  order: 900,
  component: Instances,
})

global.messages = {}
global.messages.connecting = '正在初始化 Koishi Online 运行环境……'

if (!('chrome' in window)) {
  global.unsupported = [
    '您的浏览器不支持 Koishi Online。',
    '请使用最新版本的 Chrome 或 Edge 浏览器。',
  ]
} else {
  connect(() => new ClientWebSocket())
}

if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker?.register('/sw.js', { scope: '/' })
}
