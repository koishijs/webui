import { defineExtension } from '@koishijs/client'
import {} from '@koishijs/plugin-status/src'
import Bots from './bots'
import Load from './load'
import './icons'

export default defineExtension((ctx) => {
  ctx.plugin(Bots)
  ctx.plugin(Load)
})
