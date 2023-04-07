import { receive, useStorage } from '@koishijs/client'
import type { Message } from '@koishijs/plugin-sandbox/src'
import type { RemovableRef } from '@vueuse/core'
import type { Dict } from 'koishi'
import { computed } from 'vue'

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
  (config.value.messages[message.channel] ||= []).push(message)
})

receive('sandbox/delete', ({ id, channel }) => {
  const messages = config.value.messages[channel]
  if (!messages) return
  config.value.messages[channel] = messages.filter(msg => msg.id !== id)
})

receive('sandbox/clear', () => {
  config.value.messages[channel.value] = []
})

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]
