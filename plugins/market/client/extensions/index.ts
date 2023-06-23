import { Context, store } from '@koishijs/client'
import Dependency from './dependency.vue'
import Missing from './missing.vue'
import Select from './select.vue'
import Version from './version.vue'

export default (ctx: Context) => {
  ctx.slot({
    type: 'plugin-dependency',
    component: Dependency,
    disabled: () => !(store.market && store.dependencies && store.registry),
  })

  ctx.slot({
    type: 'plugin-details',
    component: Version,
    disabled: () => !(store.market && store.dependencies && store.registry),
    order: 1000,
  })

  ctx.slot({
    type: 'plugin-missing',
    component: Missing,
    disabled: () => !(store.market && store.dependencies && store.registry),
  })

  ctx.slot({
    type: 'plugin-select',
    component: Select,
    disabled: () => !store.market,
  })
}
