import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-analytics/src'
import Charts from './charts'
import Home from './home.vue'
import './icons'

import 'virtual:uno.css'

export default (ctx: Context) => {
  // ctx.app.provide('ecTheme', 'koishi-dark')
  ctx.plugin(Charts)

  ctx.slot({
    type: 'home',
    component: Home,
    order: 0,
  })
}
