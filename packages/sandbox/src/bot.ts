import { Client } from '@koishijs/plugin-console'
import { Bot, Context, Fragment, SendOptions } from 'koishi'
import { SandboxMessenger } from './message'

export class SandboxBot extends Bot {
  username = 'koishi'
  hidden = true
  internal = {}
  clients = new Set<Client>()

  constructor(ctx: Context, config: Bot.Config) {
    super(ctx, config)
  }

  async sendMessage(channelId: string, fragment: Fragment, guildId?: string, options?: SendOptions) {
    return new SandboxMessenger(this, channelId, guildId, options).send(fragment)
  }

  async sendPrivateMessage(userId: string, fragment: Fragment, options?: SendOptions) {
    return new SandboxMessenger(this, '@' + userId, undefined, options).send(fragment)
  }

  async deleteMessage(channelId: string, messageId: string) {
    this.ctx.console.broadcast('sandbox/delete', { id: messageId, channel: channelId })
  }

  async getGuildMemberList(guildId: string) {
    return words.map((word) => ({
      nickname: word,
      userId: word,
    }))
  }
}

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]
