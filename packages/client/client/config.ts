import { RemovableRef, useDark, useLocalStorage } from '@vueuse/core'
import { reactive, watch } from 'vue'

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
  theme?: string
  locale?: string
}

const isDark = useDark()

export const config = useStorage<Config>('config', 1, () => ({
  theme: isDark.value ? 'default-dark' : 'default-light',
  locale: 'zh-CN',
}))

watch(() => config.value.theme, (theme) => {
  const root = window.document.querySelector('html')
  root.setAttribute('theme', theme)
  if (theme.endsWith('-dark')) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}, { flush: 'post', immediate: true })
