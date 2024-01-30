import { Ref, ref, shallowReactive, watch } from 'vue'
import { Context } from '../context'
import { Service } from '../utils'
import { receive, store } from '../data'
import { EffectScope } from 'cordis'
import { Dict } from 'cosmokit'

declare module '../context' {
  interface Context {
    $loader: LoaderService
    extension?: LoadResult
  }
}

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
      ctx.effect(() => {
        document.head.appendChild(link)
        return () => document.head.removeChild(link)
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

export default class LoaderService extends Service {
  private backendId: any

  public extensions: Dict<LoadResult> = shallowReactive({})

  constructor(ctx: Context) {
    super(ctx, '$loader', true)

    receive('entry-data', ({ id, data }) => {
      const entry = store.entry?.[id]
      if (!entry) return
      entry.data = data
      this.extensions[id].data.value = data
    })
  }

  initTask = new Promise<void>((resolve) => {
    watch(() => store.entry, async (newValue, oldValue) => {
      const { _id, ...rest } = newValue || {}
      if (this.backendId && _id && this.backendId !== _id) {
        window.location.reload()
        return
      }
      this.backendId = _id

      for (const key in this.extensions) {
        if (rest[key]) continue
        this.extensions[key].scope.dispose()
        delete this.extensions[key]
      }

      await Promise.all(Object.entries(rest).map(([key, { files, paths, data }]) => {
        if (this.extensions[key]) return
        const scope = this.ctx.isolate(['extension']).plugin(() => {})
        scope.ctx.extension = this.extensions[key] = { done: ref(false), scope, paths, data: ref(data) }
        const task = Promise.all(files.map((url) => {
          for (const ext in loaders) {
            if (!url.endsWith(ext)) continue
            return loaders[ext](scope.ctx, url)
          }
        }))
        task.finally(() => this.extensions[key].done.value = true)
      }))

      if (!oldValue) resolve()
    }, { deep: true })
  })
}
