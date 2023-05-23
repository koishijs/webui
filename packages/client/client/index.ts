import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { global } from './data'
import install from './components'
import Overlay from './components/chat/overlay.vue'
import internal from './settings'
import { config } from './config'
import { initTask } from './loader'
import { Context } from './context'
import { createI18n } from 'vue-i18n'

export * from './activity'
export * from './components'
export * from './config'
export * from './context'
export * from './loader'
export * from './data'
export * from './utils'

export default install

export const root = new Context()

export const router = createRouter({
  history: createWebHistory(global.uiPath),
  linkActiveClass: 'active',
  routes: [],
})

export const i18n = createI18n({
  legacy: false,
  locale: config.value.locale,
  fallbackLocale: 'zh-CN',
})

root.app.use(install)
root.app.use(i18n)
root.app.use(router)

root.plugin(internal)

root.slot({
  type: 'global',
  component: Overlay,
})

root.on('activity', data => !data)

router.beforeEach(async (to, from) => {
  if (to.matched.length) return

  if (from === START_LOCATION) {
    await initTask
    to = router.resolve(to)
    if (to.matched.length) return to
  }

  return {
    path: '/',
    query: { redirect: to.fullPath },
  }
})
