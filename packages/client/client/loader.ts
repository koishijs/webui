import { ref, watch } from 'vue'
import { Context, Dict, root, store } from '.'

export type Disposable = () => void
export type Extension = (ctx: Context) => void

export function defineExtension(callback: Extension) {
  return callback
}

const loaders: Dict<(path: string) => Promise<Disposable>> = {
  async [`.css`](path) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = path
    await new Promise((resolve, reject) => {
      link.onload = resolve
      link.onerror = reject
      document.head.appendChild(link)
    })
    return () => {
      document.head.removeChild(link)
    }
  },
  async [``](path) {
    const exports = await import(/* @vite-ignore */ path)
    const fork = root.plugin(exports.default)
    return fork.dispose
  },
}

export interface LoadResult {
  done: boolean
  task: Promise<Disposable>
  isExtension: boolean
}

export const progress = ref(0)

function notify() {
  const results = Object.values(extensions)
  progress.value = results.filter(({ done }) => done).length / results.length
}

export function queue(key: string, callback: (key: string) => Promise<Disposable>, isExtension = false) {
  const task = callback(key)
  const result = { done: false, task, isExtension }
  task.finally(() => {
    result.done = true
    notify()
  })
  if (!extensions[key]) {
    extensions[key] = result
    notify()
  }
  return task
}

function load(path: string) {
  for (const ext in loaders) {
    if (!path.endsWith(ext)) continue
    return queue(path, loaders[ext], true)
  }
}

const extensions: Dict<LoadResult> = {}

export const initTask = new Promise<void>((resolve) => {
  watch(() => store.entry, async (newValue, oldValue) => {
    newValue ||= []
    for (const path in extensions) {
      if (newValue.includes(path)) continue
      if (!extensions[path].isExtension) continue
      extensions[path].task.then(dispose => dispose())
      delete extensions[path]
    }

    await Promise.all(newValue.map(load))

    if (!oldValue) {
      resolve()
      if (!root.events.isActive) root.start()
    }
  }, { deep: true })
})

export default load
