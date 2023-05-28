import { connect, Dict, global, root } from '@koishijs/client'
import home from './home'
import layout from './layout'
import settings from './settings'
import status from './status'
import styles from './styles'
import theme from './theme'

import './index.scss'

declare module '@koishijs/plugin-console' {
  export interface ClientConfig {
    messages?: Dict<string>
    unsupported?: string[]
  }
}

root.plugin(home)
root.plugin(layout)
root.plugin(settings)
root.plugin(status)
root.plugin(styles)
root.plugin(theme)

root.app.provide('ecTheme', 'dark-blue')

root.app.mount('#app')

if (!global.static) {
  const endpoint = new URL(global.endpoint, location.origin).toString()
  connect(() => new WebSocket(endpoint.replace(/^http/, 'ws')))
}
