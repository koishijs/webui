import { Component, reactive, ref } from 'vue'
import { MaybeRefOrGetter, toValue } from '@vueuse/core'
import { Context, Dict, Disposable, omit, root, routeCache, router, store, Store } from '.'

declare module 'vue-router' {
  interface RouteMeta {
    activity?: Activity
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

export const activities = reactive<Dict<Activity>>({})

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
    this._disposables.push(router.addRoute({ path, name: id, component, meta: { activity: this } }))
    this.id ??= id
    this.handleUpdate()
    this.authority ??= 0
    this.fields ??= []
    activities[this.id] = this
  }

  handleUpdate() {
    if (redirectTo.value) {
      const location = router.resolve(redirectTo.value)
      if (location.matched.length) {
        redirectTo.value = null
        router.replace(location)
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
    if (root.bail('activity', this)) return true
    if (!this.fields.every(key => store[key])) return true
    if (this.when && !this.when()) return true
    if (this.options.disabled?.()) return true
  }

  dispose() {
    this._disposables.forEach(dispose => dispose())
    const current = router.currentRoute.value
    if (current?.meta?.activity === this) {
      redirectTo.value = current.fullPath
      router.push(routeCache['home'] || '/')
    }
    return delete activities[this.id]
  }
}
