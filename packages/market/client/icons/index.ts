import { icons } from '@koishijs/client'

import NavDeps from './activity/deps.vue'
import NavMarket from './activity/market.vue'
import NavPlugin from './activity/plugin.vue'

import CategoryAll from './category/all.vue'
import CategoryBusiness from './category/business.vue'
import CategoryConsole from './category/console.vue'
import CategoryGame from './category/game.vue'
import CategoryOther from './category/other.vue'
import CategoryStorage from './category/storage.vue'
import CategoryTool from './category/tool.vue'

import Balance from './market/balance.vue'
import Download from './market/download.vue'
import Refresh from './market/refresh.vue'
import StarEmpty from './market/star-empty.vue'
import StarFull from './market/star-full.vue'
import StarHalf from './market/star-half.vue'
import Verified from './market/verified.vue'

import AddGroup from './settings/add-group.vue'
import AddPlugin from './settings/add-plugin.vue'
import TrashCan from './settings/trash-can.vue'
import Check from './settings/check.vue'
import Play from './settings/play.vue'
import Stop from './settings/stop.vue'
import Save from './settings/save.vue'

icons.register('activity:deps', NavDeps)
icons.register('activity:market', NavMarket)
icons.register('activity:plugin', NavPlugin)

icons.register('category:all', CategoryAll)
icons.register('category:business', CategoryBusiness)
icons.register('category:console', CategoryConsole)
icons.register('category:game', CategoryGame)
icons.register('category:other', CategoryOther)
icons.register('category:storage', CategoryStorage)
icons.register('category:tool', CategoryTool)

icons.register('balance', Balance)
icons.register('download', Download)
icons.register('refresh', Refresh)
icons.register('star-empty', StarEmpty)
icons.register('star-full', StarFull)
icons.register('star-half', StarHalf)
icons.register('verified', Verified)

icons.register('add-plugin', AddPlugin)
icons.register('add-group', AddGroup)
icons.register('trash-can', TrashCan)
icons.register('check', Check)
icons.register('play', Play)
icons.register('stop', Stop)
icons.register('save', Save)
