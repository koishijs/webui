import * as cordis from 'cordis'
import { Dict, remove } from 'cosmokit'
import {
  App, Component, createApp, defineComponent, h, inject, markRaw,
  onBeforeUnmount, provide, reactive, Ref, resolveComponent,
} from 'vue'
import { createI18n } from 'vue-i18n'
import { activities, Activity } from './activity'
import { SlotOptions } from './components'
import { extensions, LoadResult } from './loader'
import ActionService from './plugins/action'
import SettingService from './plugins/setting'
import ThemeService from './plugins/theme'
import { insert } from './utils'

// layout api

export interface Events<C extends Context> extends cordis.Events<C> {
  'activity'(activity: Activity): boolean
}

export interface Context {
  [Context.events]: Events<this>
}

export function useContext() {
  const parent = inject('cordis') as Context
  const fork = parent.plugin(() => {})
  onBeforeUnmount(() => fork.dispose())
  return fork.ctx
}

export function useRpc<T>(): Ref<T> {
  const parent = inject('cordis') as Context
  return parent.extension?.data
}

export class Internal {
  extensions = extensions
  activities = activities
  routeCache = routeCache
  views = reactive<Dict<SlotOptions[]>>({})
  i18n = createI18n({
    legacy: false,
    fallbackLocale: 'zh-CN',
  })
}

export const routeCache = reactive<Record<keyof any, string>>({})

export class Context extends cordis.Context {
  // workaround injection check
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __v_isRef = undefined

  app: App

  extension?: LoadResult
  internal = new Internal()

  constructor() {
    super()
    this.provide('extension')

    this.app = createApp(defineComponent({
      setup: () => () => [
        h(resolveComponent('k-slot'), { name: 'root', single: true }),
        h(resolveComponent('k-slot'), { name: 'global' }),
      ],
    }))
    this.app.use(this.internal.i18n)
    this.app.provide('cordis', this)

    this.plugin(ActionService)
    this.plugin(SettingService)
    this.plugin(ThemeService)
  }

  addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.effect(() => {
      window.addEventListener(type, listener, options)
      return () => window.removeEventListener(type, listener, options)
    })
  }

  wrapComponent(component: Component) {
    if (!component) return
    const caller = this[Context.current] || this
    if (!caller.extension) return component
    return defineComponent((props, { slots }) => {
      provide('cordis', caller)
      return () => h(component, props, slots)
    })
  }

  /** @deprecated */
  addView(options: SlotOptions) {
    return this.slot(options)
  }

  /** @deprecated */
  addPage(options: Activity.Options) {
    return this.page(options)
  }

  slot(options: SlotOptions) {
    options.order ??= 0
    options.component = this.wrapComponent(options.component)
    if (options.when) options.disabled = () => !options.when()
    const list = this.internal.views[options.type] ||= []
    insert(list, options)
    return this.scope.collect('view', () => remove(list, options))
  }

  page(options: Activity.Options) {
    options.component = this.wrapComponent(options.component)
    const activity = new Activity(this, options)
    return this.scope.collect('page', () => activity.dispose())
  }
}

markRaw(cordis.Context.prototype)
markRaw(cordis.EffectScope.prototype)
