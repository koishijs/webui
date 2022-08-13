import { createStorage, receive } from '@koishijs/client'
import { Message } from '@koishijs/plugin-sandbox/src'
import { Dict } from 'koishi'
import { computed } from 'vue'

export const panelTypes = {
  private: '私聊模式',
  guild: '群聊模式',
  profile: '用户设置',
}

interface SandboxConfig {
  user: string
  index: number
  messages: Dict<Message[]>
  panelType: keyof typeof panelTypes
}

export const config = createStorage<SandboxConfig>('sandbox', 1, () => ({
  user: '',
  index: 0,
  messages: {},
  panelType: 'private',
}))

export const channel = computed(() => {
  if (config.panelType === 'guild') return '#'
  return '@' + config.user
})

receive('sandbox', (message: Message) => {
  (config.messages[message.channel] ||= []).push(message)
})

receive('sandbox/clear', () => {
  config.messages[channel.value] = []
})

export const words = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kathy', 'Lily', 'Mandy', 'Nancy',
  'Oscar', 'Peggy', 'Quinn', 'Randy', 'Sandy', 'Toby',
  'Uma', 'Vicky', 'Wendy', 'Xander', 'Yvonne', 'Zoe',
]
