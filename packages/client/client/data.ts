import type { ClientConfig, Console, DataService, Events } from '@koishijs/plugin-console'
import type { Promisify, Universal } from 'koishi'
import { markRaw, reactive, ref } from 'vue'
import { Context } from './context'

export type Store = {
  [K in keyof Console.Services]?: Console.Services[K] extends DataService<infer T> ? T : never
}

declare const KOISHI_CONFIG: ClientConfig
export const global = KOISHI_CONFIG
export const store = reactive<Store>({})

export function withProxy(url: string) {
  return (global.proxyBase || '') + url
}

export const socket = ref<Universal.WebSocket>(null)
const listeners: Record<string, (data: any) => void> = {}
const responseHooks: Record<string, [Function, Function]> = {}

export function send<T extends keyof Events>(type: T, ...args: Parameters<Events[T]>): Promisify<ReturnType<Events[T]>>
export function send(type: string, ...args: any[]) {
  if (!socket.value) return
  console.debug('↑%c', 'color:brown', type, args)
  const id = Math.random().toString(36).slice(2, 9)
  socket.value.send(JSON.stringify({ id, type, args }))
  return new Promise((resolve, reject) => {
    responseHooks[id] = [resolve, reject]
    setTimeout(() => {
      delete responseHooks[id]
      reject(new Error('timeout'))
    }, 60000)
  })
}

export function receive<T = any>(event: string, listener: (data: T) => void) {
  listeners[event] = listener
}

receive('data', ({ key, value }) => {
  store[key] = value
})

receive('patch', ({ key, value }) => {
  if (Array.isArray(store[key])) {
    store[key].push(...value)
  } else if (store[key]) {
    Object.assign(store[key], value)
  }
})

receive('response', ({ id, value, error }) => {
  if (!responseHooks[id]) return
  const [resolve, reject] = responseHooks[id]
  delete responseHooks[id]
  if (error) {
    reject(error)
  } else {
    resolve(value)
  }
})

export function connect(ctx: Context, callback: () => Universal.WebSocket) {
  const value = callback()

  let sendTimer: number
  let closeTimer: number
  const refresh = () => {
    if (!global.heartbeat) return
    clearTimeout(sendTimer)
    clearTimeout(closeTimer)
    sendTimer = +setTimeout(() => send('ping'), global.heartbeat.interval)
    closeTimer = +setTimeout(() => value?.close(), global.heartbeat.timeout)
  }

  const reconnect = () => {
    socket.value = null
    for (const key in store) {
      store[key] = undefined
    }
    console.log('[koishi] websocket disconnected, will retry in 1s...')
    setTimeout(() => {
      connect(ctx, callback).then(location.reload, () => {
        console.log('[koishi] websocket disconnected, will retry in 1s...')
      })
    }, 1000)
  }

  value.addEventListener('message', (ev) => {
    refresh()
    const data = JSON.parse(ev.data)
    console.debug('↓%c', 'color:purple', data.type, data.body)
    if (data.type in listeners) {
      listeners[data.type](data.body)
    }
    ctx.emit(data.type, data.body)
  })

  value.addEventListener('close', reconnect)

  return new Promise<Universal.WebSocket.Event>((resolve, reject) => {
    value.addEventListener('open', (event) => {
      socket.value = markRaw(value)
      resolve(event)
    })
    value.addEventListener('error', reject)
  })
}
