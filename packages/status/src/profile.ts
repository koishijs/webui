import { Bot, Context, Dict, pick, Schema, Time } from 'koishi'
import { cpus, freemem, totalmem } from 'os'
import { DataService } from '@koishijs/plugin-console'

declare module '@satorijs/core' {
  interface Bot {
    _messageSent: TickCounter
    _messageReceived: TickCounter
  }
}

class TickCounter {
  public stop: () => void

  private data = new Array(60).fill(0)

  private tick = () => {
    this.data.unshift(0)
    this.data.splice(-1, 1)
  }

  constructor(ctx: Context) {
    this.stop = ctx.setInterval(() => this.tick(), Time.second)
  }

  public add(value = 1) {
    this.data[0] += value
  }

  public get() {
    return this.data.reduce((prev, curr) => prev + curr, 0)
  }

  static initialize(bot: Bot, ctx: Context) {
    bot._messageSent = new TickCounter(ctx)
    bot._messageReceived = new TickCounter(ctx)
  }
}

export type LoadRate = [app: number, total: number]

let usage = getCpuUsage()
let appRate: number
let usedRate: number

async function memoryRate(): Promise<LoadRate> {
  const total = totalmem()
  return [process.memoryUsage().rss / total, 1 - freemem() / total]
}

function getCpuUsage() {
  let totalIdle = 0, totalTick = 0
  const cpuInfo = cpus()
  const usage = process.cpuUsage().user

  for (const cpu of cpuInfo) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  }

  return {
    // microsecond values
    app: usage / 1000,
    used: totalTick - totalIdle,
    total: totalTick,
  }
}

function updateCpuUsage() {
  const newUsage = getCpuUsage()
  const totalDifference = newUsage.total - usage.total
  appRate = (newUsage.app - usage.app) / totalDifference
  usedRate = (newUsage.used - usage.used) / totalDifference
  usage = newUsage
}

class ProfileProvider extends DataService<ProfileProvider.Payload> {
  cached: ProfileProvider.Payload

  constructor(ctx: Context, private config: ProfileProvider.Config) {
    super(ctx, 'profile')

    const { tickInterval } = config
    ctx.on('ready', () => {
      ctx.setInterval(() => {
        updateCpuUsage()
        this.refresh()
      }, tickInterval)
    })

    ctx.any().before('send', (session) => {
      session.bot._messageSent.add(1)
    })

    ctx.any().on('message', (session) => {
      session.bot._messageReceived.add(1)
    })

    ctx.bots.forEach(bot => TickCounter.initialize(bot, ctx))

    ctx.on('bot-added', (bot) => {
      TickCounter.initialize(bot, ctx)
      process.nextTick(() => this.refresh())
    })

    ctx.on('bot-removed', (bot) => {
      process.nextTick(() => this.refresh())
      bot._messageSent.stop()
      bot._messageReceived.stop()
    })

    ctx.on('bot-status-updated', () => {
      this.refresh()
    })
  }

  async get(forced = false) {
    if (this.cached && !forced) return this.cached
    const memory = await memoryRate()
    const cpu: LoadRate = [appRate, usedRate]
    const bots: Dict<ProfileProvider.BotData> = {}
    for (const bot of this.ctx.bots) {
      if (bot.hidden) continue
      bots[bot.ctx.state.uid] = {
        ...pick(bot, ['platform', 'selfId', 'avatar', 'username', 'status']),
        error: bot.error?.message,
        messageSent: bot._messageSent.get(),
        messageReceived: bot._messageReceived.get(),
      }
    }
    return { memory, cpu, bots }
  }
}

namespace ProfileProvider {
  export interface Config {
    tickInterval?: number
  }

  export const Config: Schema<Config> = Schema.object({
    tickInterval: Schema.natural().role('ms').description('性能数据推送的时间间隔。').default(Time.second * 5),
  })

  export interface BotData extends Pick<Bot, 'platform' | 'selfId' | 'avatar' | 'username' | 'status'> {
    error?: string
    messageSent: number
    messageReceived: number
  }

  export interface Payload {
    memory: LoadRate
    cpu: LoadRate
    bots: Dict<BotData>
  }
}

export default ProfileProvider
