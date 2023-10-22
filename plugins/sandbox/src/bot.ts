import { Client } from '@koishijs/console'
import { Bot, Context, Time, Universal } from 'koishi'
import { SandboxMessenger } from './message'

export namespace SandboxBot {
  export interface Config {
    selfId: string
    platform: string
  }
}

export class SandboxBot<C extends Context = Context> extends Bot<C, SandboxBot.Config> {
  static MessageEncoder = SandboxMessenger

  hidden = true
  internal = {}
  clients = new Set<Client>()

  constructor(ctx: C, config: SandboxBot.Config) {
    super(ctx, config)
    this.selfId = config.selfId
    this.platform = config.platform
    this.user.name = 'koishi'
  }

  async request<T = any>(method: string, data = {}) {
    const client = [...this.clients][0]
    const nonce = Math.random().toString(36).slice(2)
    return new Promise<T>((resolve, reject) => {
      const dispose1 = this.ctx.on('sandbox/response', (nonce2, data) => {
        if (nonce !== nonce2) return
        dispose1()
        dispose2()
        resolve(data)
      })
      const dispose2 = this.ctx.setTimeout(() => {
        dispose1()
        dispose2()
        reject(new Error('timeout'))
      }, Time.second * 5)
      client.send({
        type: 'sandbox/request',
        body: { method, data, nonce },
      })
    })
  }

  async createDirectChannel(userId: string): Promise<Universal.Channel> {
    return { id: '@' + userId, type: Universal.Channel.Type.DIRECT }
  }

  async deleteMessage(channelId: string, messageId: string) {
    return this.request('deleteMessage', { channelId, messageId })
  }

  async getMessage(channelId: string, messageId: string) {
    return this.request('getMessage', { channelId, messageId })
  }

  async getChannel(channelId: string, guildId?: string) {
    return this.request('getChannel', { channelId, guildId })
  }

  async getChannelList(guildId: string) {
    return this.request('getChannelList', { guildId })
  }

  async getGuild(guildId: string) {
    return this.request('getGuild', { guildId })
  }

  async getGuildList() {
    return this.request('getGuildList')
  }

  async getGuildMember(guildId: string, userId: string) {
    return this.request('getGuildMember', { guildId, userId })
  }

  async getGuildMemberList(guildId: string) {
    return this.request('getGuildMemberList', { guildId })
  }
}

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]
