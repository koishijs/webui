import { Console } from '@koishijs/plugin-console'
import { defineComponent, h, resolveComponent } from 'vue'
import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { global, Store, store } from './data'
import install, { isNullable } from './components'
import Overlay from './components/chat/overlay.vue'
import Settings from './extensions/settings.vue'
import { initTask } from './loader'
import { Context } from './context'
import { createI18n } from 'vue-i18n'

import './styles/index.scss'

export * from './activity'
export * from './components'
export * from './config'
export * from './context'
export * from './loader'
export * from './data'

export default install

export const root = new Context()

export const router = createRouter({
  history: createWebHistory(global.uiPath),
  linkActiveClass: 'active',
  routes: [],
})

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
})

root.app.use(install)
root.app.use(i18n)
root.app.use(router)

root.slot({
  type: 'global',
  component: Overlay,
})

root.page({
  path: '/settings',
  name: '用户设置',
  icon: 'activity:settings',
  position: 'bottom',
  order: -100,
  component: Settings,
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

// component helper

export type Field = keyof Console.Services

export namespace Card {
  export function create(render: Function, fields: readonly Field[] = []) {
    return defineComponent({
      render: () => fields.every(key => store[key]) ? render() : null,
    })
  }

  export interface NumericOptions {
    icon: string
    title: string
    type?: string
    fields?: Field[]
    content: (store: Store) => any
  }

  export function numeric({ type, icon, fields, title, content }: NumericOptions) {
    if (!type) {
      return defineComponent(() => () => {
        if (!fields.every(key => store[key])) return
        return h(resolveComponent('k-numeric'), { icon, title }, () => content(store))
      })
    }

    return defineComponent(() => () => {
      if (!fields.every(key => store[key])) return
      let value = content(store)
      if (isNullable(value)) return
      if (type === 'size') {
        if (value >= (1 << 20) * 1000) {
          value = (value / (1 << 30)).toFixed(1) + ' GB'
        } else if (value >= (1 << 10) * 1000) {
          value = (value / (1 << 20)).toFixed(1) + ' MB'
        } else {
          value = (value / (1 << 10)).toFixed(1) + ' KB'
        }
      }
      return h(resolveComponent('k-numeric'), { icon, title }, () => [value])
    })
  }
}
