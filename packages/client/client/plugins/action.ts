import { markRaw, MaybeRefOrGetter, reactive, shallowReactive, toValue } from 'vue'
import { Context, useContext } from '../context'
import { Dict, Intersect, remove } from 'cosmokit'
import { insert, Service } from '../utils'
import { ActionContext } from '..'

declare module '../context' {
  interface Context {
    $action: ActionService
    action(id: string, options: ActionOptions): () => void
    menu(id: string, items: MenuItem[]): () => void
    define<K extends keyof ActionContext>(key: K, value: MaybeRefOrGetter<ActionContext[K]>): () => void
  }

  interface Internal {
    scope: Store<ActionContext>
    menus: Dict<MenuItem[]>
    actions: Dict<ActionOptions>
    activeMenus: ActiveMenu[]
  }
}

export interface ActionOptions {
  shortcut?: string
  hidden?: (scope: Flatten<ActionContext>) => boolean
  disabled?: (scope: Flatten<ActionContext>) => boolean
  action: (scope: Flatten<ActionContext>) => any
}

export type LegacyMenuItem = Partial<ActionOptions> & Omit<MenuItem, 'id'>

export interface MenuItem {
  id: string
  label?: MaybeGetter<string>
  type?: MaybeGetter<string>
  icon?: MaybeGetter<string>
  order?: number
}

export type MaybeGetter<T> = T | ((scope: Flatten<ActionContext>) => T)

type Store<S extends {}> = { [K in keyof S]?: MaybeRefOrGetter<S[K]> }

type Flatten<S extends {}> = Intersect<{
  [K in keyof S]: K extends `${infer L}.${infer R}`
    ? { [P in L]: Flatten<{ [P in R]: S[K] }> }
    : { [P in K]: S[K] }
}[keyof S]>

export interface ActiveMenu {
  id: string
  relative: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

export function useMenu<K extends keyof ActionContext>(id: K) {
  const ctx = useContext()
  return (event: MouseEvent, value: MaybeRefOrGetter<ActionContext[K]>) => {
    ctx.define(id, value)
    event.preventDefault()
    const { clientX, clientY } = event
    ctx.internal.activeMenus.splice(0, Infinity, {
      id,
      relative: {
        left: clientX,
        top: clientY,
        right: clientX,
        bottom: clientY,
      },
    })
  }
}

export default class ActionService extends Service {
  constructor(ctx: Context) {
    super(ctx, '$action', true)
    ctx.mixin('$action', ['action', 'menu', 'define'])

    ctx.internal.scope = shallowReactive({})
    ctx.internal.menus = reactive({})
    ctx.internal.actions = reactive({})
    ctx.internal.activeMenus = reactive([])

    ctx.addEventListener('keydown', (event) => {
      const scope = this.createScope()
      for (const action of Object.values(ctx.internal.actions)) {
        if (!action.shortcut) continue
        const keys = action.shortcut.split('+').map(key => key.toLowerCase().trim())
        let ctrlKey = false, shiftKey = false, metaKey = false, code: string
        for (const key of keys) {
          switch (key) {
            case 'shift': shiftKey = true; continue
            case 'ctrl':
              if (navigator.platform.toLowerCase().includes('mac')) {
                metaKey = true
              } else {
                ctrlKey = true
              }
              continue
            default:
              code = key
          }
        }
        if (ctrlKey !== event.ctrlKey) continue
        if (shiftKey !== event.shiftKey) continue
        if (metaKey !== event.metaKey) continue
        if (code !== event.key.toLowerCase()) continue
        if (action.disabled?.(scope)) continue
        event.preventDefault()
        action.action(scope)
      }
    })
  }

  action(id: string, options: ActionOptions) {
    markRaw(options)
    return this[Context.current].effect(() => {
      this.ctx.internal.actions[id] = options
      return () => delete this.ctx.internal.actions[id]
    })
  }

  menu(id: string, items: MenuItem[]) {
    return this[Context.current].effect(() => {
      const list = this.ctx.internal.menus[id] ||= []
      items.forEach(item => insert(list, item))
      return () => {
        items.forEach(item => remove(list, item))
        if (!list.length) delete this.ctx.internal.menus[id]
      }
    })
  }

  define<K extends keyof ActionContext>(key: K, value: MaybeRefOrGetter<ActionContext[K]>) {
    return this[Context.current].effect(() => {
      this.ctx.internal.scope[key] = value as any
      return () => delete this.ctx.internal.scope[key]
    })
  }

  createScope(override = {}) {
    const scope = { ...this.ctx.internal.scope, ...override }
    return createScope(scope)
  }
}

function createScope(scope: Store<ActionContext>, prefix = '') {
  return new Proxy({}, {
    get: (target, key) => {
      if (typeof key === 'symbol') return target[key]
      key = prefix + key
      if (key in scope) return toValue(scope[key])
      const _prefix = key + '.'
      if (Object.keys(scope).some(k => k.startsWith(_prefix))) {
        return createScope(scope, key + '.')
      }
    },
  })
}
