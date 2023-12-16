import { defineExtension } from '@koishijs/client'
import {} from '@koishijs/plugin-analytics/src'
import Charts from './charts'
import Home from './home.vue'
import './icons'

export default defineExtension((ctx) => {
  // ctx.app.provide('ecTheme', 'koishi-dark')
  ctx.plugin(Charts)

  ctx.slot({
    type: 'home',
    component: Home,
    order: 0,
  })
})
