import { defineExtension } from '@koishijs/client'
import {} from '@koishijs/plugin-status/src'
import Bots from './bots'
import Load from './load'
import Analytics from './analytics.vue'
import EnvInfo from './envinfo.vue'
import './icons'

export default defineExtension((ctx) => {
  ctx.plugin(Bots)
  ctx.plugin(Load)

  ctx.slot({
    type: 'status-left',
    component: EnvInfo,
  })

  ctx.slot({
    type: 'analytic-number',
    component: Analytics,
  })
})
