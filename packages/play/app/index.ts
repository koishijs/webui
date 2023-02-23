import { connect, root } from '@koishijs/client'
import Instances from './components/instances.vue'
import ClientWebSocket from './socket'
import '@koishijs/client/app'

root.slot({
  type: 'home',
  order: 900,
  component: Instances,
})

connect(() => new ClientWebSocket())

if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker?.register('/sw.js', { scope: '/' })
}
