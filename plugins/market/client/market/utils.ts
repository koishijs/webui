import { store } from '@koishijs/client'

export function getKeywords(name: string) {
  return store.packages[name]?.keywords || store.market.data[name].keywords || []
}
