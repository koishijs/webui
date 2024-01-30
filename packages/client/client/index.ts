import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { global } from './data'
import install, { Dict } from './components'
import Overlay from './components/chat/overlay.vue'
import { redirectTo } from './activity'
import { initTask } from './loader'
import { Context, routeCache } from './context'

declare module '@koishijs/plugin-console' {
  export interface ClientConfig {
    messages?: Dict<string>
    unsupported?: string[]
  }
}

export * as Satori from '@satorijs/protocol'
export * as Universal from '@satorijs/protocol'
export * from './plugins/action'
export * from './plugins/setting'
export * from './plugins/theme'
export * from './activity'
export * from './components'
export * from './context'
export * from './loader'
export * from './data'
export { Service } from './utils'

export default install

export interface ActionContext {}

export interface Config {
  theme: Config.Theme
  locale?: string
}

export namespace Config {
  export interface Theme {
    mode: 'auto' | 'dark' | 'light'
    dark: string
    light: string
  }
}

export const root = new Context()

export const router = createRouter({
  history: createWebHistory(global.uiPath),
  linkActiveClass: 'active',
  routes: [],
})

const initialTitle = document.title

router.afterEach((route) => {
  const { name, fullPath } = router.currentRoute.value
  routeCache[name] = fullPath
  if (route.meta.activity) {
    document.title = `${route.meta.activity.name}`
    if (initialTitle) document.title += ` | ${initialTitle}`
  }
})

root.app.use(install)
root.app.use(router)

root.slot({
  type: 'global',
  component: Overlay,
})

root.on('activity', data => !data)

router.beforeEach(async (to, from) => {
  if (to.matched.length) {
    if (to.matched[0].path !== '/') {
      redirectTo.value = null
    }
    return
  }

  if (from === START_LOCATION) {
    await initTask
    to = router.resolve(to)
    if (to.matched.length) return to
  }

  redirectTo.value = to.fullPath
  const result = routeCache['home'] || '/'
  if (result === to.fullPath) return
  return result
})
