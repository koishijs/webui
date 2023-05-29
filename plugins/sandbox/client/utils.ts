import { receive, send, useStorage } from '@koishijs/client'
import type { Message } from '@koishijs/plugin-sandbox'
import type { RemovableRef } from '@vueuse/core'
import type { Dict } from 'koishi'
import { computed } from 'vue'

declare module '@koishijs/client' {
  interface ActionContext {
    'sandbox.message': Message
  }
}

export const panelTypes = {
  private: '私聊模式',
  guild: '群聊模式',
  profile: '用户设置',
}

interface SandboxConfig {
  platform: string
  user: string
  index: number
  messages: Dict<Message[]>
  panelType: keyof typeof panelTypes
}

export const config: RemovableRef<SandboxConfig> = useStorage<SandboxConfig>('sandbox', 1.1, () => ({
  platform: 'sandbox:' + Math.random().toString(36).slice(2),
  user: '',
  index: 0,
  messages: {},
  panelType: 'private',
}))

export const channel = computed(() => {
  if (config.value.panelType === 'guild') return '#'
  return '@' + config.value.user
})

receive('sandbox/message', (message: Message) => {
  if (message.platform !== config.value.platform) return
  (config.value.messages[message.channel] ||= []).push(message)
})

receive('sandbox/clear', () => {
  config.value.messages[channel.value] = []
})

export const api = {
  deleteMessage({ messageId, channelId }) {
    const messages = config.value.messages[channelId]
    if (!messages) return
    config.value.messages[channelId] = messages.filter(msg => msg.id !== messageId)
  },
  getMessage({ messageId, channelId }) {
    return config.value.messages[channelId]?.find(msg => msg.id === messageId)
  },
  getChannel({ channelId, guildId }) {
    return { channelId: '#' }
  },
  getChannelList({ guildId }) {
    return [{ channelId: '#' }]
  },
  getGuild({ guildId }) {
    return { guildId: '#' }
  },
  getGuildList() {
    return [{ guildId: '#' }]
  },
  getGuildMember({ guildId, userId }) {
    return { userId, username: userId }
  },
  getGuildMemberList({ guildId }) {
    return Object
      .keys(config.value.messages)
      .filter(id => id.startsWith('@'))
      .map((key) => {
        const userId = key.slice(1)
        return { userId, username: userId }
      })
  },
}

receive('sandbox/request', ({ method, nonce, data }) => {
  const result = api[method]?.(data)
  send('sandbox/response', nonce, result)
})

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]
