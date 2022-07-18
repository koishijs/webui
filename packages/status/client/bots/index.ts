import { Context } from '@koishijs/client'
import Bots from './index.vue'

export default (ctx: Context) => {
  ctx.addView({
    type: 'status-right',
    component: Bots,
  })
}
