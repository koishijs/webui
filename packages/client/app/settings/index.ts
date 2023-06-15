import { Context, Schema } from '@koishijs/client'
import Settings from './settings.vue'
import Theme from './theme.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/settings/:name*',
    name: '用户设置',
    icon: 'activity:settings',
    position: 'bottom',
    order: -100,
    component: Settings,
  })

  ctx.schema({
    type: 'string',
    role: 'theme',
    component: Theme,
  })

  ctx.settings({
    id: '',
    title: '通用设置',
    order: 1000,
    schema: Schema.object({
      locale: Schema.union(['zh-CN', 'en-US']).description('语言设置。'),
    }).description('通用设置'),
  })

  ctx.settings({
    id: 'appearance',
    title: '外观设置',
    order: 900,
    schema: Schema.object({
      theme: Schema.object({
        mode: Schema.union([
          Schema.const('auto').description('跟随系统'),
          Schema.const('dark').description('深色'),
          Schema.const('light').description('浅色'),
        ]).description('主题偏好。'),
        dark: Schema.string().role('theme', { mode: 'dark' }).description('深色主题。'),
        light: Schema.string().role('theme', { mode: 'light' }).description('浅色主题。'),
      }).description('主题设置'),
    }),
  })

  ctx.settings({
    id: 'activity',
    title: '活动栏设置',
    order: 800,
  })
}
