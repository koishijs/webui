import { Component, reactive } from 'vue'
import { MaybeComputedRef, resolveUnref } from '@vueuse/core'
import { Dict, Disposable, Field, omit, root, router, store } from '.'

declare module 'vue-router' {
  interface RouteMeta {
    activity?: Activity
  }
}

export namespace Activity {
  export interface BaseOptions {
    name: MaybeComputedRef<string>
    desc?: MaybeComputedRef<string>
    icon?: MaybeComputedRef<string>
    order?: number
    authority?: number
    position?: 'top' | 'bottom'
    fields?: Field[]
    when?: () => boolean
  }

  export interface RouteOptions extends BaseOptions {
    id?: string
    path: string
    strict?: boolean
    component: Component
  }

  export interface ButtonOptions extends BaseOptions {
    id: string
    action: () => void
  }

  export type Options = RouteOptions | ButtonOptions
}

export const activities = reactive<Dict<Activity>>({})

export interface Activity extends Activity.BaseOptions {
  id: string
  path?: string
  component?: Component
  action?: () => void
}

export class Activity {
  _disposables: Disposable[] = []

  constructor(public options: Activity.Options) {
    Object.assign(this, omit(options, ['icon', 'name', 'desc', 'position']))
    if ('path' in options) {
      const { path, id = path, component } = options
      this._disposables.push(router.addRoute({ path, name: id, component, meta: { activity: this } }))
      this.id ??= path
    }
    this.order ??= 0
    this.authority ??= 0
    this.fields ??= []
    activities[this.id] = this
  }

  get icon() {
    return resolveUnref(this.options.icon ?? 'application')
  }

  get name() {
    return resolveUnref(this.options.name ?? this.id)
  }

  get desc() {
    return resolveUnref(this.options.desc)
  }

  get position() {
    if (root.bail('activity', this)) return
    if (!this.fields.every(key => store[key])) return
    if (this.when && !this.when()) return
    return this.options.position ?? 'top'
  }

  dispose() {
    this._disposables.forEach(dispose => dispose())
    if (activities[this.id] === this) {
      delete activities[this.id]
      return true
    }
  }
}
