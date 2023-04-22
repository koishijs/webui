import { Context } from '@koishijs/client'
import Load from './index.vue'

export default (ctx: Context) => {
  ctx.slot({
    type: 'status-right',
    component: Load,
  })
}
