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
    Object.assign(this, omit(options, ['icon', 'name', 'desc', 'position']))
    const { path, id = getActivityId(path), component } = options
    this._disposables.push(router.addRoute({ path, name: id, component, meta: { activity: this } }))
    this.id ??= path
    this.handleUpdate()
    this.order ??= 0
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

  get position() {
    if (root.bail('activity', this)) return
    if (!this.fields.every(key => store[key])) return
    if (this.when && !this.when()) return
    if (this.disabled?.()) return
    return this.options.position ?? 'top'
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
