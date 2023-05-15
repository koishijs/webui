import { icons } from '@koishijs/client'

import NavDeps from './activity/deps.vue'
import NavMarket from './activity/market.vue'
import NavPlugin from './activity/plugin.vue'

import Refresh from './market/refresh.vue'
import Rocket from './market/rocket.vue'

icons.register('activity:deps', NavDeps)
icons.register('activity:market', NavMarket)
icons.register('activity:plugin', NavPlugin)

icons.register('refresh', Refresh)
icons.register('rocket', Rocket)
