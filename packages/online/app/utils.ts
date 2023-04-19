import { ref, shallowRef, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { dump } from 'js-yaml'
import { promises as fs } from 'fs'
import { provideStorage } from '@koishijs/client'
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

const storageData = shallowRef({})

provideStorage((key, version, fallback) => {
  if (!data.value.current) throw new Error('no instance selected')

  const result = ref()
  watch(storageData, () => {
    const initial = fallback ? fallback() : {}
    initial['__version__'] = version
    if (storageData.value[key]?.['__version__'] !== version) {
      storageData.value[key] = initial
    }
    result.value = storageData.value[key]
  }, { immediate: true })

  watch(result, () => {
    storageData.value[key] = result.value
    fs.writeFile(`${root}/${data.value.current}/storage/${key}.json`, JSON.stringify(result.value))
  }, { deep: true })

  return result
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
  await fs.mkdir(`${root}/${id}/storage`, { recursive: true })
  try {
    await loader.init(`${root}/${id}`)
    await loader.readConfig()
  } catch {
    loader.config = {
      plugins: {
        'console': {},
        'help': {},
        'insight': {},
        'sandbox': {},
        'market': {},
        'dataview': {},
      },
    }
    await fs.writeFile(filename, dump(loader.config))
    instances.value = await fs.readdir(root)
    await loader.init(`${root}/${id}`)
  }
  const files = await fs.readdir(`${root}/${id}/storage`)
  const storage = {}
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const key = file.slice(0, -5)
    storage[key] = await fs.readFile(`${root}/${id}/storage/${file}`, 'utf8').then(JSON.parse)
  }
  storageData.value = storage
  const app = await loader.createApp()
  await app.start()
}

export async function initialize() {
  instances.value = await fs.readdir(root)
  await activate(data.value.current)
}
