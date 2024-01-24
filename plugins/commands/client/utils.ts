import { Schema, store } from '@koishijs/client'

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
