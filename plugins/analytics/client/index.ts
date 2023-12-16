import { defineExtension } from '@koishijs/client'
import {} from '@koishijs/plugin-analytics/src'
import Charts from './charts'
import Numbers from './numbers'
import Home from './home.vue'
import './icons'

export default defineExtension((ctx) => {
  // ctx.app.provide('ecTheme', 'koishi-dark')
  ctx.plugin(Charts)
  ctx.plugin(Numbers)

  ctx.slot({
    type: 'home',
    component: Home,
    order: 0,
  })
})
