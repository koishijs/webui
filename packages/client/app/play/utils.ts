import { useLocalStorage } from '@vueuse/core'
import { config } from '@koishijs/client'
import { dump, load } from 'js-yaml'

interface StorageData {
  version?: number
  current: string
  instances: string[]
}

const version = 2

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
  instances: [],
})

let loader: typeof import('@koishijs/play').default

export function create() {
  const id = Math.random().toString(36).slice(2, 10)
  data.value.current = id
  data.value.instances.push(id)
  if (loader) activate(id)
}

export async function activate(id: string) {
  await loader.app?.stop()
  data.value.current = id
  const filename = `/instances/${id}/koishi.yml`
  try {
    loader.config = load(await loader.fs.promises.readFile(filename, 'utf8'))
  } catch {
    loader.config = {
      plugins: {
        'console': {},
        'help': {},
        'sandbox': {},
        'market': {},
      },
    }
    // filer doesn't support recursive mkdir
    await loader.fs.promises.mkdir('/instances').catch(() => {})
    await loader.fs.promises.mkdir(`/instances/${id}`).catch(() => {})
    await loader.fs.promises.writeFile(filename, dump(loader.config))
  }
  const app = await loader.createApp()
  await app.start()
}

if (!data.value.instances.length) {
  create()
}

export async function getLoader() {
  if (loader) return loader
  const url = config.endpoint + '/modules/@koishijs/play/index.js'
  return loader = (await import(/* @vite-ignore */ url)).default
}
