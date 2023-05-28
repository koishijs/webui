import { Context } from '@koishijs/client'
import Home from './home.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/',
    name: '欢迎',
    icon: 'activity:home',
    order: 1000,
    component: Home,
  })
}
