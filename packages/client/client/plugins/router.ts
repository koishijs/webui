import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import Overlay from '../components/chat/overlay.vue'
import { Context } from '../context'
import { insert, Service } from '../utils'
import { Component, MaybeRefOrGetter, reactive, ref, toValue } from 'vue'
import { global, Store, store } from '../data'
import { Dict, omit, remove } from 'cosmokit'
import { Disposable } from 'cordis'
import { SlotOptions } from '../components'

declare module 'vue-router' {
  interface RouteMeta {
    activity?: Activity
  }
}

declare module '../context' {
  interface Context {
    $router: RouterService
    slot(options: SlotOptions): () => void
    page(options: Activity.Options): () => void
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Events<C> {
    'activity'(activity: Activity): boolean
  }
}

export namespace Activity {
  export interface Options {
    id?: string
    path: string
    strict?: boolean
    component: Component
    name: MaybeRefOrGetter<string>
    desc?: MaybeRefOrGetter<string>
    icon?: MaybeRefOrGetter<string>
    order?: number
    authority?: number
    position?: 'top' | 'bottom'
    fields?: (keyof Store)[]
    /** @deprecated */
    when?: () => boolean
    disabled?: () => boolean
  }
}

export interface Activity extends Activity.Options {}

function getActivityId(path: string) {
  return path.split('/').find(Boolean) ?? ''
}

export const redirectTo = ref<string>()

export class Activity {
  id: string
  _disposables: Disposable[] = []

  constructor(public ctx: Context, public options: Activity.Options) {
    options.order ??= 0
    options.position ??= 'top'
    Object.assign(this, omit(options, ['icon', 'name', 'desc', 'disabled']))
    const { path, id = getActivityId(path), component } = options
    this._disposables.push(ctx.$router.router.addRoute({ path, name: id, component, meta: { activity: this } }))
    this.id ??= id
    this.handleUpdate()
    this.authority ??= 0
    this.fields ??= []
    ctx.$router.pages[this.id] = this
  }

  handleUpdate() {
    if (redirectTo.value) {
      const location = this.ctx.$router.router.resolve(redirectTo.value)
      if (location.matched.length) {
        redirectTo.value = null
        this.ctx.$router.router.replace(location)
      }
    }
  }

  get icon() {
    return toValue(this.options.icon ?? 'activity:default')
  }

  get name() {
    return toValue(this.options.name ?? this.id)
  }

  get desc() {
    return toValue(this.options.desc)
  }

  disabled() {
    if (this.ctx.bail('activity', this)) return true
    if (!this.fields.every(key => store[key])) return true
    if (this.when && !this.when()) return true
    if (this.options.disabled?.()) return true
  }

  dispose() {
    this._disposables.forEach(dispose => dispose())
    const current = this.ctx.$router.router.currentRoute.value
    if (current?.meta?.activity === this) {
      redirectTo.value = current.fullPath
      this.ctx.$router.router.push(this.ctx.$router.cache['home'] || '/')
    }
    return delete this.ctx.$router.pages[this.id]
  }
}

export default class RouterService extends Service {
  public views = reactive<Dict<SlotOptions[]>>({})
  public cache = reactive<Record<keyof any, string>>({})
  public pages = reactive<Dict<Activity>>({})
  public router = createRouter({
    history: createWebHistory(global.uiPath),
    linkActiveClass: 'active',
    routes: [],
  })

  constructor(ctx: Context) {
    super(ctx, '$router', true)
    ctx.mixin('$router', ['slot', 'page'])

    const initialTitle = document.title
    ctx.effect(() => this.router.afterEach((route) => {
      const { name, fullPath } = this.router.currentRoute.value
      this.cache[name] = fullPath
      if (route.meta.activity) {
        document.title = `${route.meta.activity.name}`
        if (initialTitle) document.title += ` | ${initialTitle}`
      }
    }))

    this.router.beforeEach(async (to, from) => {
      if (to.matched.length) {
        if (to.matched[0].path !== '/') {
          redirectTo.value = null
        }
        return
      }

      if (from === START_LOCATION) {
        await ctx.$loader.initTask
        to = this.router.resolve(to)
        if (to.matched.length) return to
      }

      redirectTo.value = to.fullPath
      const result = this.cache['home'] || '/'
      if (result === to.fullPath) return
      return result
    })

    this.slot({
      type: 'global',
      component: Overlay,
    })
  }

  slot(options: SlotOptions) {
    const caller = this[Context.current]
    options.order ??= 0
    options.component = caller.wrapComponent(options.component)
    if (options.when) options.disabled = () => !options.when()
    return caller.effect(() => {
      const list = this.views[options.type] ||= []
      insert(list, options)
      return () => {
        remove(list, options)
        if (!list.length) delete this.views[options.type]
      }
    })
  }

  page(options: Activity.Options) {
    const caller = this[Context.current]
    options.component = caller.wrapComponent(options.component)
    return caller.effect(() => {
      const activity = new Activity(caller, options)
      return () => activity.dispose()
    })
  }
}
