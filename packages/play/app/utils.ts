import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { dump, load } from 'js-yaml'
import { promises as fs } from 'fs'
import loader from './loader'

globalThis.fs = fs
globalThis.loader = loader

interface StorageData {
  version?: number
  current: string
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
})

export const root = '/koishi/play/v1/instances'
export const instances = ref<string[]>([])

export async function remove(key: string) {
  await fs.unlink(`${root}/${key}`)
  instances.value = await fs.readdir(root)
}

export async function activate(id?: string) {
  await loader.app?.stop()
  id ||= Math.random().toString(36).slice(2, 10)
  data.value.current = id
  const filename = `${root}/${id}/koishi.yml`
  try {
    loader.config = load(await fs.readFile(filename, 'utf8'))
    if (!loader.config?.plugins) throw new Error()
  } catch {
    loader.config = {
      plugins: {
        'console': {},
        'help': {},
        'sandbox': {},
        'market': {},
      },
    }
    await fs.mkdir(`${root}/${id}`, { recursive: true })
    await fs.writeFile(filename, dump(loader.config))
    instances.value = await fs.readdir(root)
  }
  const app = await loader.createApp()
  await app.start()
}

export async function initialize() {
  instances.value = await fs.readdir(root)
  await activate(data.value.current)
}
