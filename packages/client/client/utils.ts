import { defineComponent, h, resolveComponent } from 'vue'
import { Console } from '@koishijs/plugin-console'
import { isNullable } from 'cosmokit'
import { Store, store } from './data'

export type Field = keyof Console.Services

export namespace Card {
  export function create(render: Function, fields: readonly Field[] = []) {
    return defineComponent({
      render: () => fields.every(key => store[key]) ? render() : null,
    })
  }

  export interface NumericOptions {
    icon: string
    title: string
    type?: string
    fields?: Field[]
    content: (store: Store) => any
  }

  export function numeric({ type, icon, fields, title, content }: NumericOptions) {
    if (!type) {
      return defineComponent(() => () => {
        if (!fields.every(key => store[key])) return
        return h(resolveComponent('k-numeric'), { icon, title }, () => content(store))
      })
    }

    return defineComponent(() => () => {
      if (!fields.every(key => store[key])) return
      let value = content(store)
      if (isNullable(value)) return
      if (type === 'size') {
        if (value >= (1 << 20) * 1000) {
          value = (value / (1 << 30)).toFixed(1) + ' GB'
        } else if (value >= (1 << 10) * 1000) {
          value = (value / (1 << 20)).toFixed(1) + ' MB'
        } else {
          value = (value / (1 << 10)).toFixed(1) + ' KB'
        }
      }
      return h(resolveComponent('k-numeric'), { icon, title }, () => [value])
    })
  }
}
