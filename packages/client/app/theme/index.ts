import { Context, router } from '@koishijs/client'
import App from './index.vue'

export default function (ctx: Context) {
  ctx.slot({
    type: 'root',
    component: App,
    order: -1000,
  })

  ctx.action('theme.activity.settings', {
    action: () => router.push('/settings/activity'),
  })

  ctx.menu('theme.activity', [{
    id: '.settings',
    label: '活动栏设置',
  }])
}
