import { Context, Schema } from '@koishijs/client'
import {} from '@koishijs/plugin-status/src'
import Bots from './bots'
import Load from './load'
import Analytics from './analytics.vue'
import Config from './config.vue'
import EnvInfo from './envinfo.vue'
import './icons'

import 'virtual:uno.css'

declare module '@koishijs/client' {
  interface Config {
    mergeThreshold: number
  }
}

export default (ctx: Context) => {
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

  ctx.slot({
    type: 'plugin-details',
    component: Config,
    order: -500,
  })

  ctx.settings({
    id: 'status',
    schema: Schema.object({
      mergeThreshold: Schema.number().default(10).description('当机器人的数量超过这个值时将合并显示状态指示灯。'),
    }).description('机器人设置'),
  })
}
