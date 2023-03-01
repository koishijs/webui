import { computed } from 'vue'
import { Dict, Schema, store } from '@koishijs/client'
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

export function assignSchema(schema: Schema, value: any) {
  if (['intersect', 'union'].includes(schema.type)) {
    for (const item of schema.list) {
      assignSchema(item, value)
    }
  } else if (schema.type === 'object') {
    for (const key in value) {
      if (!schema.dict[key]) continue
      schema.dict[key] = schema.dict[key].default(value[key])
    }
  }
}

export function createSchema(name: string, value: any) {
  const result = new Schema(store.schema[name])
  if (!value) return result
  assignSchema(result, value)
  return result
}
