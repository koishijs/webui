import { reactive } from 'vue'
import { RouteRecordName } from 'vue-router'
import { global, router } from '@koishijs/client'

export * from '@koishijs/client'

export const routeCache = reactive<Record<RouteRecordName, string>>({})

router.afterEach((route) => {
  const { name, fullPath } = router.currentRoute.value
  routeCache[name] = fullPath
  if (route.meta.activity) {
    document.title = `${route.meta.activity.name} | ${global.messages?.title || 'Koishi 控制台'}`
  }
})
