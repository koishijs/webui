import * as cordis from 'cordis'
import {
  App, Component, createApp, defineComponent, h, inject, markRaw,
  onBeforeUnmount, provide, Ref, resolveComponent,
} from 'vue'
import ActionService from './plugins/action'
import I18nService from './plugins/i18n'
import LoaderService from './plugins/loader'
import RouterService from './plugins/router'
import SettingService from './plugins/setting'
import ThemeService from './plugins/theme'

// layout api

export interface Events<C extends Context> extends cordis.Events<C> {}

export interface Context {
  [Context.events]: Events<this>
  internal: Internal
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

export interface Internal {}

export class Context extends cordis.Context {
  // workaround injection check
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __v_isRef = undefined

  app: App

  constructor() {
    super()
    this.extension = null
    this.internal = {} as Internal
    this.app = createApp(defineComponent({
      setup: () => () => [
        h(resolveComponent('k-slot'), { name: 'root', single: true }),
        h(resolveComponent('k-slot'), { name: 'global' }),
      ],
    }))
    this.app.provide('cordis', this)

    this.plugin(ActionService)
    this.plugin(I18nService)
    this.plugin(LoaderService)
    this.plugin(RouterService)
    this.plugin(SettingService)
    this.plugin(ThemeService)

    this.on('ready', async () => {
      await this.$loader.initTask
      this.app.use(this.$i18n.i18n)
      this.app.use(this.$router.router)
      this.app.mount('#app')
    })
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
}

markRaw(cordis.Context.prototype)
markRaw(cordis.EffectScope.prototype)
