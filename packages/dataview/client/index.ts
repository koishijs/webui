import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-dataview'
import Database from './index.vue'
import './icons'

export default (ctx: Context) => {
  ctx.addPage({
    path: '/database/:name*',
    name: '数据库',
    icon: 'activity:database',
    order: 410,
    authority: 4,
    fields: ['dbInfo'],
    component: Database,
  })
}
