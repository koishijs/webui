import { Context } from '@koishijs/client'
import Load from './index.vue'

export default (ctx: Context) => {
  ctx.addView({
    type: 'status-right',
    component: Load,
  })
}
