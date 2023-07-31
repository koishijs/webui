import { reactive, watch } from 'vue'
import { Context, Dict, root, store } from '.'
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
    ctx.plugin(unwrapExports(exports))
  },
}

export interface LoadResult {
  scope: EffectScope
  done: boolean
  paths: string[]
}

export const extensions: Dict<LoadResult> = reactive({})

export const initTask = new Promise<void>((resolve) => {
  watch(() => store.entry, async (newValue, oldValue) => {
    newValue ||= {}
    for (const key in extensions) {
      if (newValue[key]) continue
      extensions[key].scope.dispose()
      delete extensions[key]
    }

    await Promise.all(Object.entries(newValue).map(([key, { files, paths }]) => {
      if (extensions[key]) return
      const scope = root.plugin(() => {})
      scope.ctx.extension = extensions[key] = { done: false, scope, paths }
      const task = Promise.all(files.map((url) => {
        for (const ext in loaders) {
          if (!url.endsWith(ext)) continue
          return loaders[ext](scope.ctx, url)
        }
      }))
      task.finally(() => extensions[key].done = true)
    }))

    if (!oldValue) {
      resolve()
      if (!root.events.isActive) root.start()
    }
  }, { deep: true })
})
