import * as cordis from 'cordis'
import { Schema, SchemaBase } from '@koishijs/components'
import { Dict, remove } from 'cosmokit'
import { App, Component, createApp, defineComponent, h, inject, markRaw, reactive, resolveComponent } from 'vue'
import { Activity } from './activity'
import { SlotOptions } from './components'

// layout api

export interface Theme {
  id: string
  name: string | Dict<string>
}

export type Computed<T> = T | (() => T)

export const views = reactive<Dict<SlotOptions[]>>({})

export interface Events<C extends Context> extends cordis.Events<C> {
  'activity'(activity: Activity): boolean
}

export interface Context {
  [Context.events]: Events<this>
}

export function useCordis() {
  return inject('cordis') as Context
}

interface SettingOptions {
  key: string
  title: string
  schema?: Schema
  component?: Component
}

export class Context extends cordis.Context {
  app: App
  themes = reactive<Dict<Theme>>({})
  settings = reactive<Dict<SettingOptions>>({})

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
    markRaw(options.component)
    const list = views[options.type] ||= []
    const index = list.findIndex(a => a.order < options.order)
    if (index >= 0) {
      list.splice(index, 0, options)
    } else {
      list.push(options)
    }
    return this.scope.collect('view', () => remove(list, options))
  }

  page(options: Activity.Options) {
    const activity = new Activity(options)
    return this.scope.collect('page', () => {
      return activity.dispose()
    })
  }

  schema(extension: SchemaBase.Extension) {
    SchemaBase.extensions.add(extension)
    return this.scope.collect('schema', () => SchemaBase.extensions.delete(extension))
  }

  extendSettings(options: SettingOptions) {
    markRaw(options)
    this.settings[options.key] = options
    return this.scope.collect('settings', () => delete this.settings[options.key])
  }

  theme(options: Theme) {
    markRaw(options)
    this.themes[options.id] = options
    return this.scope.collect('view', () => delete this.themes[options.id])
  }
}
