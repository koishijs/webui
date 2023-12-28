import { connect, global, root } from '@koishijs/client'
import home from './home'
import layout from './layout'
import settings from './settings'
import status from './status'
import styles from './styles'
import theme from './theme'

import 'virtual:uno.css'
import './index.scss'

root.plugin(home)
root.plugin(layout)
root.plugin(settings)
root.plugin(status)
root.plugin(styles)
root.plugin(theme)

root.app.mount('#app')

if (!global.static) {
  const endpoint = new URL(global.endpoint, location.origin).toString()
  connect(() => new WebSocket(endpoint.replace(/^http/, 'ws')))
}
