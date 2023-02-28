import { computed } from 'vue'
import { Dict, store } from '@koishijs/client'
import { CommandData } from '@koishijs/plugin-commands'

function getCommands(data: CommandData[]) {
  const result: CommandData[] = []
  for (const item of data) {
    result.push(item)
    if (!item.children) continue
    result.push(...getCommands(item.children))
  }
  return result
}

export const commands = computed<Dict<CommandData>>(() => {
  if (!store.commands) return {}
  return Object.fromEntries(getCommands(store.commands).map((item) => [item.name, item]))
})
