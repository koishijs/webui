import { ref, Ref, shallowReactive, watch } from 'vue'
import { Context, Dict, receive, root, store } from '.'
import { EffectScope } from 'cordis'

export type Disposable = () => void
export type Extension = (ctx: Context) => void

export function defineExtension(callback: Extension) {
  return callback
}

export function unwrapExports(module: any) {
  return module?.default || module
}

const loaders: Dict<(ctx: Context, url: string) => Promise<void>> = {
  async [`.css`](ctx, url) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    await new Promise((resolve, reject) => {
      link.onload = resolve
      link.onerror = reject
      document.head.appendChild(link)
      ctx.on('dispose', () => {
        document.head.removeChild(link)
      })
    })
  },
  async [``](ctx, url) {
    const exports = await import(/* @vite-ignore */ url)
    ctx.plugin(unwrapExports(exports), ctx.extension.data)
  },
}

export interface LoadResult {
  scope: EffectScope
  paths: string[]
  done: Ref<boolean>
  data: Ref
}

export const extensions: Dict<LoadResult> = shallowReactive({})

let backendId: any

export const initTask = new Promise<void>((resolve) => {
  watch(() => store.entry, async (newValue, oldValue) => {
    const { _id, ...rest } = newValue || {}
    if (backendId && _id && backendId !== _id) {
      window.location.reload()
      return
    }
    backendId = _id

    for (const key in extensions) {
      if (rest[key]) continue
      extensions[key].scope.dispose()
      delete extensions[key]
    }

    await Promise.all(Object.entries(rest).map(([key, { files, paths, data }]) => {
      if (extensions[key]) return
      const scope = root.isolate(['extension']).plugin(() => {})
      scope.ctx.extension = extensions[key] = { done: ref(false), scope, paths, data: ref(data) }
      const task = Promise.all(files.map((url) => {
        for (const ext in loaders) {
          if (!url.endsWith(ext)) continue
          return loaders[ext](scope.ctx, url)
        }
      }))
      task.finally(() => extensions[key].done.value = true)
    }))

    if (!oldValue) {
      resolve()
      if (!root.events.isActive) root.start()
    }
  }, { deep: true })
})

receive('entry-data', ({ id, data }) => {
  const entry = store.entry?.[id]
  if (!entry) return
  entry.data = data
  extensions[id].data.value = data
})
