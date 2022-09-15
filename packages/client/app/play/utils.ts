import { useLocalStorage } from '@vueuse/core'
import { Context, Dict } from 'koishi'
import { config } from '@koishijs/client'
import { Loader } from '@koishijs/loader'

interface StorageData {
  version?: number
  current: string
  instances: Dict<Context.Config>
}

const version = 1

function createStorage(initial: StorageData) {
  const storage = useLocalStorage('koishi-play', {} as StorageData)
  if (storage.value.version !== version) {
    storage.value = { ...initial, version }
  } else {
    storage.value = { ...initial, ...storage.value }
  }
  return storage
}

export const data = createStorage({
  current: null,
  instances: {},
})

let loader: Loader

export function create() {
  const id = Math.random().toString(36).slice(2, 10)
  data.value.current = id
  data.value.instances[id] = {
    plugins: {
      'console': {},
      'help': {},
      'sandbox': {},
      'market': {},
    },
  }
  if (loader) activate(id)
}

export async function activate(id: string) {
  await loader.app?.stop()
  data.value.current = id
  loader.config = data.value.instances[id]
  const app = await loader.createApp()
  await app.start()
}

if (!Object.keys(data.value.instances).length) {
  create()
}

export async function getLoader() {
  if (loader) return loader
  const url = config.endpoint + '/modules/@koishijs/loader/index.js'
  const { default: Loader }: typeof import('@koishijs/loader') = await import(/* @vite-ignore */ url)
  return loader = new Loader()
}
