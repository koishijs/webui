import { Context, store } from '@koishijs/client'
import Dependency from './dependency.vue'
import Missing from './missing.vue'
import Select from './select.vue'
import Version from './version.vue'

export default (ctx: Context) => {
  ctx.slot({
    type: 'plugin-dependency',
    component: Dependency,
    when: () => !!(store.market && store.dependencies),
  })

  ctx.slot({
    type: 'plugin-details',
    component: Version,
    when: () => !!(store.market && store.dependencies),
    order: 1000,
  })

  ctx.slot({
    type: 'plugin-missing',
    component: Missing,
    when: () => !!(store.market && store.dependencies),
  })

  ctx.slot({
    type: 'plugin-select',
    component: Select,
    when: () => !!store.market,
  })
}
