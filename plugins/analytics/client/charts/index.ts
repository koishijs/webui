import { Context } from '@koishijs/client'
import CommandChart from './command'
import BotChart from './bot'
import HistoryChart from './history'
import HourChart from './hour'

export default (ctx: Context) => {
  // 用户数量增长 频道数量增长
  // 消息数量 (收/发) 每小时 QPS (收/发)
  // 指令调用频率 机器人消息频率

  ctx.plugin(HistoryChart)
  ctx.plugin(HourChart)
  ctx.plugin(BotChart)
  ctx.plugin(CommandChart)
}
