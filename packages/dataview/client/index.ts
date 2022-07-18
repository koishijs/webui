import { Card, Context } from '@koishijs/client'
import {} from '@koishijs/plugin-dataview/src'
import Database from './index.vue'
import './icons'

export default (ctx: Context) => {
  ctx.addPage({
    path: '/database/:name*',
    name: '数据库',
    icon: 'database',
    order: 410,
    authority: 4,
    fields: ['database'],
    component: Database,
  })

  ctx.addView({
    type: 'numeric',
    component: Card.numeric({
      title: '数据库体积',
      icon: 'database',
      type: 'size',
      fields: ['database'],
      content: ({ database }) => database.size,
    }),
  })
}
