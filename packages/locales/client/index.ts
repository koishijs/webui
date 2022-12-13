import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-locales'
import Locales from './locales.vue'

export default (ctx: Context) => {
  ctx.page({
    path: '/locales',
    name: '本地化',
    icon: 'tools',
    order: 500,
    authority: 4,
    fields: ['locales'],
    component: Locales,
  })
}
