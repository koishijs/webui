import { $, Context, deepEqual, Dict, Logger, pick, Query, Row, Schema, Session, Time, Universal } from 'koishi'
import { DataService } from '@koishijs/console'
import { resolve } from 'path'

declare module 'koishi' {
  interface Tables {
    'analytics.message': Analytics.Message
    'analytics.command': Analytics.Command
  }
}

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      analytics: Analytics
    }
  }
}

export interface MessageStats {
  send: number
  receive: number
}

const logger = new Logger('analytics')

class Analytics extends DataService<Analytics.Payload> {
  static inject = ['database', 'console']

  lastUpdate = new Date()
  updateHour = this.lastUpdate.getHours()
  cachedDate: number
  cachedData: Promise<Analytics.Payload>

  private messages: Analytics.Message[] = []
  private commands: Analytics.Command[] = []

  constructor(ctx: Context, public config: Analytics.Config = {}) {
    super(ctx, 'analytics')

    ctx.model.extend('analytics.message', {
      date: 'integer',
      hour: 'integer',
      type: 'string(63)',
      selfId: 'string(63)',
      platform: 'string(63)',
      count: 'integer',
    }, {
      primary: ['date', 'hour', 'type', 'selfId', 'platform'],
    })

    ctx.model.extend('analytics.command', {
      date: 'integer',
      hour: 'integer',
      name: 'string(63)',
      selfId: 'string(63)',
      userId: 'integer',
      channelId: 'string(63)',
      platform: 'string(63)',
      count: 'integer',
    }, {
      primary: ['date', 'hour', 'name', 'selfId', 'userId', 'channelId', 'platform'],
    })

    ctx.on('exit', () => this.upload(true))

    ctx.on('dispose', async () => {
      await this.upload(true)
    })

    ctx.on('message', (session) => {
      this.addAudit(this.messages, {
        ...this.createIndex(session),
        type: 'receive',
      })
      this.upload()
    })

    ctx.on('send', (session) => {
      this.addAudit(this.messages, {
        ...this.createIndex(session),
        type: 'send',
      })
      this.upload()
    })

    ctx.any().before('command/execute', ({ command, session }) => {
      this.addAudit(this.commands, {
        ...this.createIndex(session),
        name: command.name,
        userId: session.user['id'] || 0,
        channelId: session.channelId,
      })
      this.upload()
    })

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  }

  private createIndex(session: Session): Analytics.Index {
    return {
      selfId: session.selfId,
      platform: session.platform,
      date: Time.getDateNumber(),
      hour: new Date().getHours(),
    }
  }

  private addAudit<T extends Analytics.Audit>(buffer: T[], index: Omit<T, 'count'>) {
    const audit = buffer.find(data => deepEqual(pick(data, Object.keys(index) as (keyof T)[]), index))
    if (audit) {
      audit.count += 1
    } else {
      buffer.push({ ...index, count: 1 } as T)
    }
  }

  private async uploadAudit(table: string, buffer: Analytics.Audit[]) {
    if (!buffer.length) return
    await this.ctx.database.upsert(table as any, (row: Row<Analytics.Audit>) => buffer.map((audit) => ({
      ...audit,
      count: $.add($.ifNull(row.count, 0), audit.count),
    })))
    buffer.splice(0)
  }

  async upload(forced = false) {
    const date = new Date()
    const dateHour = date.getHours()
    if (forced || +date - +this.lastUpdate > this.config.statsInternal || dateHour !== this.updateHour) {
      this.lastUpdate = date
      this.updateHour = dateHour
      await Promise.all([
        this.uploadAudit('analytics.message', this.messages),
        this.uploadAudit('analytics.command', this.commands),
      ])
      logger.debug('analytics updated')
    }
  }

  private queryRecent(): Query.FieldExpr<number> {
    return {
      $gte: Time.getDateNumber() - this.config.recentDayCount,
      $lt: Time.getDateNumber(),
    }
  }

  private async getCommandRate(lengthTask: Promise<number>) {
    const data = await this.ctx.database
      .select('analytics.command', {
        date: this.queryRecent(),
      })
      .groupBy(['name'], {
        count: row => $.sum(row.count),
      })
      .execute()
    const length = await lengthTask
    const result = {} as Dict<number>
    data.forEach((stat) => {
      result[stat.name] = stat.count / length
    })
    return result
  }

  private async getDauHistory() {
    const data = await this.ctx.database
      .select('analytics.command', {
        date: { $gte: Time.getDateNumber() - this.config.recentDayCount },
        userId: { $gt: 0 },
      })
      .groupBy(['date'], {
        count: row => $.count(row.userId),
      })
      .execute()
    const result: number[] = new Array(this.config.recentDayCount + 1).fill(0)
    const today = Time.getDateNumber()
    data.forEach((stat) => {
      result[today - stat.date] = stat.count
    })
    return result
  }

  private async getMessageByBot(lengthTask: Promise<number>) {
    const data = await this.ctx.database
      .select('analytics.message', {
        date: this.queryRecent(),
      })
      .groupBy(['type', 'platform', 'selfId'], {
        count: row => $.sum(row.count),
      })
      .execute()
    const length = await lengthTask
    const result = {} as Dict<Dict<MessageStats & Universal.User>>
    data.forEach((stat) => {
      const entry = (result[stat.platform] ||= {})[stat.selfId] ||= {
        ...this.ctx.bots[`${stat.platform}:${stat.selfId}`]?.user,
        send: 0,
        receive: 0,
      }
      entry[stat.type] = stat.count / length
    })
    return result
  }

  private async getMessageByDate() {
    const data = await this.ctx.database
      .select('analytics.message', {
        date: { $lt: Time.getDateNumber() },
      })
      .groupBy(['type', 'date'], {
        count: row => $.sum(row.count),
      })
      .orderBy('date', 'desc')
      .execute()
    const today = Time.getDateNumber()
    const result: MessageStats[] = []
    data.forEach((stat) => {
      const entry = result[today - stat.date] ||= { send: 0, receive: 0 }
      entry[stat.type] = stat.count
    })
    for (let i = 0; i < result.length; i++) {
      result[i] ||= { send: 0, receive: 0 }
    }
    return result
  }

  private async getMessageByHour(lengthTask: Promise<number>) {
    const data = await this.ctx.database
      .select('analytics.message', {
        date: this.queryRecent(),
      })
      .groupBy(['type', 'hour'], {
        count: row => $.sum(row.count),
      })
      .execute()
    const length = await lengthTask
    const result = new Array(24).fill(null).map(() => ({ send: 0, receive: 0 }))
    data.forEach((stat) => {
      result[stat.hour][stat.type] = stat.count / length
    })
    return result
  }

  async download(): Promise<Analytics.Payload> {
    const messageByDateTask = this.getMessageByDate()
    const lengthTask = messageByDateTask.then((data) => {
      return Math.min(Math.max(data.length - 1, 1), this.config.recentDayCount)
    })
    const [
      userCount,
      userIncrement,
      guildCount,
      guildIncrement,
      commandRate,
      dauHistory,
      messageByBot,
      messageByDate,
      messageByHour,
    ] = await Promise.all([
      this.ctx.database.eval('user', row => $.count(row.id)),
      this.ctx.database.eval('user', row => $.count(row.id), {
        createdAt: {
          $gte: Time.fromDateNumber(Time.getDateNumber() - 1),
          $lt: Time.fromDateNumber(Time.getDateNumber()),
        },
      }),
      this.ctx.database.eval('channel', row => $.sum(1), row => $.eq(row.id, row.guildId)),
      this.ctx.database.eval('channel', row => $.sum(1), row => $.and(
        $.eq(row.id, row.guildId),
        $.gte(row.createdAt, Time.fromDateNumber(Time.getDateNumber() - 1)),
        $.lt(row.createdAt, Time.fromDateNumber(Time.getDateNumber())),
      )),
      this.getCommandRate(lengthTask),
      this.getDauHistory(),
      this.getMessageByBot(lengthTask),
      messageByDateTask,
      this.getMessageByHour(lengthTask),
    ])
    return {
      userCount,
      userIncrement,
      guildCount,
      guildIncrement,
      commandRate,
      dauHistory,
      messageByBot,
      messageByDate,
      messageByHour,
    }
  }

  async get() {
    const date = new Date()
    const dateNumber = Time.getDateNumber(date, date.getTimezoneOffset())
    if (dateNumber !== this.cachedDate) {
      this.cachedData = this.download()
      this.cachedDate = dateNumber
    }
    return this.cachedData
  }
}

namespace Analytics {
  export interface Index {
    id?: number
    date: number
    hour: number
    selfId: string
    platform: string
  }

  export interface Audit extends Index {
    count: number
  }

  export interface Message extends Index {
    type: string
    count: number
  }

  export interface Command extends Index {
    name: string
    userId: number
    channelId: string
    count: number
  }

  export interface Payload {
    userCount: number
    userIncrement: number
    guildCount: number
    guildIncrement: number
    dauHistory: number[]
    commandRate: Dict<number>
    messageByBot: Dict<Dict<MessageStats & Universal.User>>
    messageByDate: MessageStats[]
    messageByHour: MessageStats[]
  }

  export interface Config {
    statsInternal?: number
    recentDayCount?: number
  }

  export const Config: Schema<Config> = Schema.object({
    statsInternal: Schema.natural().role('ms').description('统计数据推送的时间间隔。').default(Time.minute * 10),
    recentDayCount: Schema.natural().description('统计最近几天的数据。').default(7),
  })
}

export default Analytics
