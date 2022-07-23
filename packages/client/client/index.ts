import { Console } from '@koishijs/plugin-console'
import { Dict } from 'koishi'
import { App, Component, defineComponent, h, markRaw, reactive, ref, Ref, resolveComponent, watch } from 'vue'
import { createRouter, createWebHistory, RouteMeta, RouteRecordNormalized, START_LOCATION } from 'vue-router'
import { config, Store, store } from './data'
import install, { isNullable, remove } from './components'
import Overlay from './components/chat/overlay.vue'
import * as cordis from 'cordis'

export * from './components'
export * from './data'

export default install

// layout api

export type Field = keyof Console.Services
export type Computed<T> = T | (() => T)

export interface SlotOptions {
  type: string
  order?: number
  component: Component
}

export interface PageExtension {
  name: string
  fields?: Field[]
  badge?: () => number
}

interface RouteMetaExtension {
  icon?: string
  order?: number
  authority?: number
  position?: Computed<'top' | 'bottom' | 'hidden'>
}

export interface PageOptions extends RouteMetaExtension, PageExtension {
  path: string
  strict?: boolean
  component: Component
}

declare module 'vue-router' {
  interface RouteMeta extends RouteMetaExtension {
    fields?: Field[]
    badge?: (() => number)[]
  }
}

export const views = reactive<Record<string, SlotOptions[]>>({})

export const router = createRouter({
  history: createWebHistory(config.uiPath),
  linkActiveClass: 'active',
  routes: [],
})

export const extensions = reactive<Dict<cordis.Fork<Context>>>({})

export const routes: Ref<RouteRecordNormalized[]> = ref([])

export type Disposable = () => void
export type Extension = (ctx: Context) => void

export function getValue<T>(computed: Computed<T>): T {
  return typeof computed === 'function' ? (computed as any)() : computed
}

export interface Events<C extends Context> extends cordis.Events<C> {
  'activity'(meta: RouteMeta): boolean
}

export interface Context {
  [Context.events]: Events<this>
}

export class Context extends cordis.Context {
  static app: App

  /** @deprecated */
  addView(options: SlotOptions) {
    return this.slot(options)
  }

  /** @deprecated */
  addPage(options: PageOptions) {
    return this.page(options)
  }

  slot(options: SlotOptions) {
    options.order ??= 0
    markRaw(options.component)
    const list = views[options.type] ||= []
    const index = list.findIndex(a => a.order < options.order)
    if (index >= 0) {
      list.splice(index, 0, options)
    } else {
      list.push(options)
    }
    return this.state.collect('view', () => remove(list, options))
  }

  page(options: PageOptions) {
    const { path, name, component, badge, fields = [], ...rest } = options
    const dispose = router.addRoute({
      path,
      name,
      component,
      meta: {
        order: 0,
        authority: 0,
        position: 'top',
        fields,
        badge: badge ? [badge] : [],
        ...rest,
      },
    })
    routes.value = router.getRoutes()
    return this.state.collect('page', () => {
      dispose()
      routes.value = router.getRoutes()
      return true
    })
  }
}

export const root = new Context()

root.on('activity', (options) => {
  return !options.fields.every(key => store[key])
})

root.slot({
  type: 'global',
  component: Overlay,
})

export function defineExtension(callback: Extension) {
  return callback
}

async function loadExtension(path: string) {
  if (extensions[path]) return

  if (path.endsWith('.css')) {
    extensions[path] = root.plugin((ctx) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = path
      document.head.appendChild(link)
      ctx.on('dispose', () => {
        document.head.removeChild(link)
      })
    })
    return
  }

  const exports = await import(/* @vite-ignore */ path)
  extensions[path] = root.plugin(exports.default)

  const { redirect } = router.currentRoute.value.query
  if (typeof redirect === 'string') {
    const location = router.resolve(redirect)
    if (location.matched.length) {
      router.replace(location)
    }
  }
}

const initTask = new Promise<void>((resolve) => {
  watch(() => store.http, async (newValue, oldValue) => {
    newValue ||= []
    for (const path in extensions) {
      if (newValue.includes(path)) continue
      extensions[path].dispose()
      delete extensions[path]
    }

    await Promise.all(newValue.map((path) => {
      return loadExtension(path).catch(console.error)
    }))

    if (!oldValue) resolve()
  }, { deep: true })
})

router.beforeEach(async (to, from) => {
  if (to.matched.length) return

  if (from === START_LOCATION) {
    await initTask
    to = router.resolve(to)
    if (to.matched.length) return to
  }

  const routes = router.getRoutes()
    .filter(item => item.meta.position === 'top')
    .sort((a, b) => b.meta.order - a.meta.order)
  const path = routes[0]?.path || '/blank'
  return {
    path,
    query: { redirect: to.fullPath },
  }
})

// component helper

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
