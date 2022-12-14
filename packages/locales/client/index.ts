import { Context, icons } from '@koishijs/client'
import {} from '@koishijs/plugin-locales'
import Locales from './locales.vue'
import Activity from './icons/activity.vue'
import Globe from './icons/globe.vue'

icons.register('activity:locales', Activity)
icons.register('globe', Globe)

export default (ctx: Context) => {
  ctx.page({
    path: '/locales',
    name: '本地化',
    icon: 'activity:locales',
    order: 500,
    authority: 4,
    fields: ['locales'],
    component: Locales,
  })
}
