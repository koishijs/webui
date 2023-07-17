import { ref, shallowRef, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { dump } from 'js-yaml'
import { promises as fs } from 'fs'
import { Dict, provideStorage } from '@koishijs/client'
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
    fs.writeFile(`${root}/${data.value.current}/data/storage/${key}.json`, JSON.stringify(result.value))
  }, { deep: true })

  return result
})

interface Instance {
  name: string
  lastVisit: number
}

export const root = '/koishi/play/v1/instances'
export const instances = ref<Dict<Instance>>({})

export async function remove(key: string) {
  await fs.rm(`${root}/${key}`, { recursive: true })
  delete instances.value[key]
  await fs.writeFile(`${root}/index.json`, JSON.stringify(instances.value))
}

export async function activate(id?: string) {
  await loader.app?.stop()
  id ||= Math.random().toString(36).slice(2, 10)
  data.value.current = id
  const filename = `${root}/${id}/koishi.yml`
  await fs.mkdir(`${root}/${id}/data/storage`, { recursive: true })
  try {
    await loader.init(`${root}/${id}`)
    await loader.readConfig()
  } catch {
    loader.config = {
      plugins: {
        'config': {},
        'console': {},
        'database-sqlite': {},
        'dataview': {},
        'explorer': {
          ignored: ['data'],
        },
        'help': {},
        'insight': {},
        'locales': {},
        'logger': {},
        'market': {},
        'sandbox': {},
        'theme-vanilla': {},
      },
    }
    await fs.writeFile(filename, dump(loader.config))
    instances.value[id] = { name: id, lastVisit: Date.now() }
    await fs.writeFile(`${root}/index.json`, JSON.stringify(instances.value))
    await loader.init(`${root}/${id}`)
  }
  const files = await fs.readdir(`${root}/${id}/data/storage`)
  const storage = {}
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const key = file.slice(0, -5)
    storage[key] = await fs.readFile(`${root}/${id}/data/storage/${file}`, 'utf8').then(JSON.parse)
  }
  storageData.value = storage
  const app = await loader.createApp()
  await app.start()
}

function isObject(value: any): value is Dict {
  return value && typeof value === 'object' && !Array.isArray(value)
}

async function getInstances() {
  const handle = await fs.open(`${root}/index.json`, 'w+')
  const content = await handle.readFile('utf8')
  const result: Dict<Instance> = content
    ? JSON.parse(content)
    : Object.fromEntries((await fs.readdir(root, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => [dirent.name, {}]))
  if (!isObject(result)) {
    throw new Error('invalid instance index')
  }
  for (const id in result) {
    result[id].name ??= id
    result[id].lastVisit ??= 0
  }
  return result
}

export async function initialize() {
  await fs.mkdir(root, { recursive: true })
  try {
    instances.value = await getInstances()
  } catch (e) {
    console.warn(e)
    instances.value = {}
    await fs.rm(root, { recursive: true })
    await fs.mkdir(root, { recursive: true })
  }
  await activate(data.value.current)
}
