import { Schema, SchemaBase } from '@koishijs/components'
import { RemovableRef, useLocalStorage } from '@vueuse/core'
import { Context } from '../context'
import { insert, Ordered, Service } from '../utils'
import { Dict, remove } from 'cosmokit'
import { Component, computed, markRaw, reactive, ref, watch } from 'vue'
import { Config } from '..'

declare module '../context' {
  interface Context {
    $setting: SettingService
    schema(extension: SchemaBase.Extension): () => void
    settings(options: SettingOptions): () => void
  }

  interface Internal {
    settings: Dict<SettingOptions[]>
  }
}

interface SettingOptions extends Ordered {
  id: string
  title?: string
  disabled?: () => boolean
  schema?: Schema
  component?: Component
}

export let useStorage = <T extends object>(key: string, version: number, fallback?: () => T): RemovableRef<T> => {
  const initial = fallback ? fallback() : {} as T
  initial['__version__'] = version
  const storage = useLocalStorage('koishi.console.' + key, initial)
  if (storage.value['__version__'] !== version) {
    storage.value = initial
  }
  return storage
}

export function provideStorage(factory: typeof useStorage) {
  useStorage = factory
}

interface StorageData<T> {
  version: number
  data: T
}

/** @deprecated use `useConfig` instead */
export function createStorage<T extends object>(key: string, version: number, fallback?: () => T) {
  const storage = useLocalStorage('koishi.console.' + key, {} as StorageData<T>)
  const initial = fallback ? fallback() : {} as T
  if (storage.value.version !== version) {
    storage.value = { version, data: initial }
  } else if (!Array.isArray(storage.value.data)) {
    storage.value.data = { ...initial, ...storage.value.data }
  }
  return reactive<T>(storage.value['data'])
}

export const original = useStorage<Config>('config', undefined, () => ({
  theme: {
    mode: 'auto',
    dark: 'default-dark',
    light: 'default-light',
  },
  locale: 'zh-CN',
}))

export const resolved = ref({} as Config)

export const useConfig = (useOriginal = false) => useOriginal ? original : resolved

export default class SettingService extends Service {
  constructor(ctx: Context) {
    super(ctx, '$setting', true)
    ctx.mixin('$setting', ['schema', 'settings'])

    ctx.internal.settings = reactive({})

    this.settings({
      id: '',
      title: '通用设置',
      order: 1000,
      schema: Schema.object({
        locale: Schema.union(['zh-CN', 'en-US']).description('语言设置。'),
      }).description('通用设置'),
    })

    const schema = computed(() => {
      const list: Schema[] = []
      for (const settings of Object.values(ctx.internal.settings)) {
        for (const options of settings) {
          if (options.schema) {
            list.push(options.schema)
          }
        }
      }
      return Schema.intersect(list)
    })

    const doWatch = () => watch(resolved, (value) => {
      console.debug('config', value)
      original.value = schema.value.simplify(value)
    }, { deep: true })

    let stop = doWatch()

    const update = () => {
      stop?.()
      try {
        resolved.value = schema.value(original.value)
      } catch (error) {
        console.error(error)
      }
      stop = doWatch()
    }

    ctx.effect(() => () => stop?.())

    ctx.effect(() => watch(original, update, { deep: true }))
    ctx.effect(() => watch(schema, update))
  }

  schema(extension: SchemaBase.Extension) {
    const caller = this[Context.current]
    extension.component = caller.wrapComponent(extension.component)
    return caller.effect(() => {
      SchemaBase.extensions.add(extension)
      return () => SchemaBase.extensions.delete(extension)
    })
  }

  settings(options: SettingOptions) {
    markRaw(options)
    const caller = this[Context.current]
    options.order ??= 0
    options.component = caller.wrapComponent(options.component)
    return caller.effect(() => {
      const list = caller.internal.settings[options.id] ||= []
      insert(list, options)
      return () => {
        remove(list, options)
        if (!list.length) delete caller.internal.settings[options.id]
      }
    })
  }
}
