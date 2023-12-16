import { defineComponent, h, resolveComponent } from 'vue'
import { store, Store } from '@koishijs/client'
import Numeric from './numeric.vue'

export interface NumericOptions {
  icon: string
  title: string
  fields?: (keyof Store)[]
  content: (store: Store) => any
}

export function createNumeric({ icon, fields, title, content }: NumericOptions) {
  return defineComponent(() => () => {
    if (!fields.every(key => store[key])) return
    return h(Numeric, { icon, title }, () => content(store))
  })
}
