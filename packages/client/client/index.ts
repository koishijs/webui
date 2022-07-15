import { Console } from '@koishijs/plugin-console'
import { Dict } from 'koishi'
import { App, Component, defineComponent, h, markRaw, reactive, ref, Ref, resolveComponent, watch } from 'vue'
import { createRouter, createWebHistory, RouteRecordNormalized, START_LOCATION } from 'vue-router'
import { config, Store, store } from './data'
import install, { remove } from './components'
import Overlay from './components/chat/overlay.vue'
import * as cordis from 'cordis'

export * from './components'
export * from './data'

export default install

// layout api

export type Field = keyof Console.Services
export type Computed<T> = T | (() => T)

export interface ViewOptions {
  type: string
  order?: number
  component: Component
}

export interface WidgetOptions {
  id: string
  type: 'small' | 'medium' | 'large'
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

export const views = reactive<Record<string, ViewOptions[]>>({})
export const widgets = reactive<WidgetOptions[]>([])

export const router = createRouter({
  history: createWebHistory(config.uiPath),
  linkActiveClass: 'active',
  routes: [],
})

export const extensions = reactive<Dict<cordis.Fork<Context>>>({})

export const routes: Ref<RouteRecordNormalized[]> = ref([])

export type Disposable = () => void
export type Extension = (ctx: Context) => void

interface DisposableExtension extends PageExtension {
  ctx: Context
}

export function getValue<T>(computed: Computed<T>): T {
  return typeof computed === 'function' ? (computed as any)() : computed
}

export interface Context {}

export class Context extends cordis.Context {
  static app: App
  static pending: Dict<DisposableExtension[]> = {}

  addView(options: ViewOptions) {
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

  widget(options: WidgetOptions) {
    markRaw(options.component)
    widgets.push(options)
    return this.state.collect('widget', () => remove(widgets, options))
  }

  addPage(options: PageOptions) {
    const { path, name, component, badge, ...rest } = options
    const dispose = router.addRoute({
      path,
      name,
      component,
      meta: {
        order: 0,
        authority: 0,
        position: 'top',
        fields: [],
        badge: badge ? [badge] : [],
        ...rest,
      },
    })
    routes.value = router.getRoutes()
    const route = routes.value.find(r => r.name === name)
    for (const options of Context.pending[name] || []) {
      this.mergeMeta(route, options)
    }
    return this.state.collect('page', () => {
      dispose()
      routes.value = router.getRoutes()
      return true
    })
  }

  private mergeMeta(route: RouteRecordNormalized, options: DisposableExtension) {
    const { fields, badge } = options
    if (fields) route.meta.fields.push(...fields)
    if (badge) route.meta.badge.push(badge)
  }

  extendsPage(options: PageExtension): void
  extendsPage(options: DisposableExtension) {
    const { name } = options
    options.ctx = this
    const route = router.getRoutes().find(r => r.name === name)
    if (route) {
      this.mergeMeta(route, options)
    } else {
      (Context.pending[name] ||= []).push(options)
    }
  }
}

export const root = new Context()

root.addView({
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
    const render = type ? () => h(resolveComponent('k-numeric'), {
      icon, title, type, value: content(store), fallback: '未安装',
    }) : () => h(resolveComponent('k-numeric'), {
      icon, title,
    }, () => content(store))
    return create(render, fields)
  }
}
