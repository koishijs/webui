import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-notifier/src'
import Config from './config.vue'

import 'virtual:uno.css'

export default (ctx: Context) => {
  ctx.slot({
    type: 'plugin-details',
    component: Config,
    order: 0,
  })
}
