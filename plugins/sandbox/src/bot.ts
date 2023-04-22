import { Client } from '@koishijs/plugin-console'
import { Bot, Context, Fragment, SendOptions, Time } from 'koishi'
import { SandboxMessenger } from './message'

export class SandboxBot extends Bot {
  username = 'koishi'
  hidden = true
  internal = {}
  clients = new Set<Client>()

  constructor(ctx: Context, config: Bot.Config) {
    super(ctx, config)
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

  async sendMessage(channelId: string, fragment: Fragment, guildId?: string, options?: SendOptions) {
    return new SandboxMessenger(this, channelId, guildId, options).send(fragment)
  }

  async sendPrivateMessage(userId: string, fragment: Fragment, options?: SendOptions) {
    return new SandboxMessenger(this, '@' + userId, undefined, options).send(fragment)
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
