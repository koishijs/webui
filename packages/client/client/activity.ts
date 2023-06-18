import { Component, reactive } from 'vue'
import { MaybeRefOrGetter, toValue } from '@vueuse/core'
import { Dict, Disposable, Field, omit, root, router, store } from '.'

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
    fields?: Field[]
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

export class Activity {
  id: string
  _disposables: Disposable[] = []

  constructor(public options: Activity.Options) {
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
    const { redirect } = router.currentRoute.value.query
    if (typeof redirect === 'string') {
      const location = router.resolve(redirect)
      if (location.matched.length) {
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
      router.push({
        path: '/',
        query: { redirect: current.fullPath },
      })
    }
    if (activities[this.id]) {
      delete activities[this.id]
      return true
    }
  }
}
