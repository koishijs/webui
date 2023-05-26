import * as cordis from 'cordis'
import { Schema, SchemaBase } from '@koishijs/components'
import { Dict, remove } from 'cosmokit'
import { App, Component, createApp, defineComponent, h, inject, markRaw, onBeforeUnmount, provide, reactive, resolveComponent } from 'vue'
import { Activity } from './activity'
import { SlotOptions } from './components'
import { useColorMode, useConfig } from './config'

const config = useConfig()
const mode = useColorMode()

// layout api

export interface ThemeOptions {
  id: string
  name: string | Dict<string>
  components?: Dict<Component>
}

export type Computed<T> = T | (() => T)

export interface Events<C extends Context> extends cordis.Events<C> {
  'activity'(activity: Activity): boolean
}

export interface Context {
  [Context.events]: Events<this>
}

export function useContext() {
  const parent = inject('cordis') as Context
  let _ctx: Context
  const fork = parent.plugin((ctx) => {
    _ctx = ctx as any
  })
  onBeforeUnmount(() => fork.dispose())
  return _ctx
}

interface SettingOptions {
  id: string
  title?: string
  order?: number
  schema?: Schema
  component?: Component
}

export class Context extends cordis.Context {
  app: App
  views = reactive<Dict<SlotOptions[]>>({})
  themes = reactive<Dict<ThemeOptions>>({})
  settings = reactive<Dict<SettingOptions[]>>({})

  constructor() {
    super()
    this.app = createApp(defineComponent({
      setup() {
        return () => [
          h(resolveComponent('k-slot'), { name: 'root', single: true }),
          h(resolveComponent('k-slot'), { name: 'global' }),
        ]
      },
    }))
    this.app.provide('cordis', this)
  }

  protected wrapComponent(component: Component) {
    if (!component) return
    const caller = this[Context.current] || this
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
    markRaw(options)
    options.order ??= 0
    options.component = this.wrapComponent(options.component)
    const list = this.views[options.type] ||= []
    const index = list.findIndex(a => a.order < options.order)
    if (index >= 0) {
      list.splice(index, 0, options)
    } else {
      list.push(options)
    }
    return this.scope.collect('view', () => remove(list, options))
  }

  page(options: Activity.Options) {
    options.component = this.wrapComponent(options.component)
    const activity = new Activity(options)
    return this.scope.collect('page', () => activity.dispose())
  }

  schema(extension: SchemaBase.Extension) {
    SchemaBase.extensions.add(extension)
    extension.component = this.wrapComponent(extension.component)
    return this.scope.collect('schema', () => SchemaBase.extensions.delete(extension))
  }

  extendSettings(options: SettingOptions) {
    markRaw(options)
    options.order ??= 0
    options.component = this.wrapComponent(options.component)
    const list = this.settings[options.id] ||= []
    const index = list.findIndex(a => a.order < options.order)
    if (index >= 0) {
      list.splice(index, 0, options)
    } else {
      list.push(options)
    }
    return this.scope.collect('settings', () => delete this.settings[options.id])
  }

  theme(options: ThemeOptions) {
    markRaw(options)
    this.themes[options.id] = options
    for (const [type, component] of Object.entries(options.components || {})) {
      this.slot({
        type,
        when: () => config.value.theme[mode.value] === options.id,
        component,
      })
    }
    return this.scope.collect('view', () => delete this.themes[options.id])
  }
}
