import { RemovableRef, useLocalStorage, usePreferredDark } from '@vueuse/core'
import { computed, reactive, watchEffect } from 'vue'

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

export interface Config {
  theme: Config.Theme
  locale?: string
}

export namespace Config {
  export interface Theme {
    mode: 'auto' | 'dark' | 'light'
    dark: string
    light: string
  }
}

export const config = useStorage<Config>('config', 1.1, () => ({
  theme: {
    mode: 'auto',
    dark: 'default-dark',
    light: 'default-light',
  },
  locale: 'zh-CN',
}))

const preferDark = usePreferredDark()

const mode = computed(() => {
  const mode = config.value.theme.mode
  if (mode !== 'auto') return mode
  return preferDark.value ? 'dark' : 'light'
})

export function useColorMode() {
  return mode
}

watchEffect(() => {
  const root = window.document.querySelector('html')
  root.setAttribute('theme', config.value.theme[mode.value])
  if (mode.value === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}, { flush: 'post' })
