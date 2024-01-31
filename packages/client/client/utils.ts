import { markRaw } from 'vue'
import * as cordis from 'cordis'
import { Context } from './context'

export type Service = cordis.Service<Context>
export const Service = cordis.Service<Context>

export interface Ordered {
  order?: number
}

export function insert<T extends Ordered>(list: T[], item: T) {
  markRaw(item)
  const index = list.findIndex(a => a.order < item.order)
  if (index >= 0) {
    list.splice(index, 0, item)
  } else {
    list.push(item)
  }
}
