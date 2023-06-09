import { Context, deepEqual, icons, message, pick, router, Schema, send, store, useConfig } from '@koishijs/client'
import { defineComponent, h, resolveComponent, watch } from 'vue'
import { shared, showLoginDialog, showSyncDialog } from './utils'
import Login from './login.vue'
import Profile from './profile.vue'
import At from './icons/at.vue'
import Check from './icons/check.vue'
import Lock from './icons/lock.vue'
import SignIn from './icons/sign-in.vue'
import SignOut from './icons/sign-out.vue'
import UserFull from './icons/user-full.vue'
import BindDialog from './bind-dialog.vue'
import SyncDialog from './sync-dialog.vue'

icons.register('at', At)
icons.register('check', Check)
icons.register('lock', Lock)
icons.register('sign-in', SignIn)
icons.register('sign-out', SignOut)
icons.register('user-full', UserFull)

export default (ctx: Context) => {
  if (shared.value.token && shared.value.expiredAt > Date.now()) {
    send('login/token', shared.value.id, shared.value.token).catch(e => message.error(e.message))
  }

  ctx.on('activity', (data) => {
    return data.authority > 0 && (!store.user || store.user.authority < data.authority)
  })

  ctx.scope.disposables.push(router.beforeEach((route) => {
    const { activity } = route.meta
    if (!activity) return
    if ((activity.authority || activity.fields.includes('user')) && !store.user) {
      // handle router.back()
      return history.state.forward === '/login' ? '/' : '/login'
    }

    if (activity.authority && activity.authority > store.user.authority) {
      message.error('权限不足。')
      return false
    }
  }))

  ctx.page({
    path: '/login',
    name: '登录',
    icon: 'sign-in',
    position: 'bottom',
    order: 500,
    when: () => !store.user,
    component: Login,
  })

  ctx.page({
    path: '/profile',
    name: '用户资料',
    icon: 'user-full',
    fields: ['user'],
    position: 'bottom',
    order: 500,
    component: Profile,
  })

  ctx.slot({
    type: 'global',
    component: BindDialog,
  })

  ctx.slot({
    type: 'global',
    component: SyncDialog,
  })

  ctx.settings({
    id: 'user',
    title: '用户设置',
    component: defineComponent(() => () => h(resolveComponent('k-form'), {
      schema: Schema.object({
        sync: Schema.boolean().description('在多个客户端间同步设置。'),
      }).description('同步设置'),
      initial: shared.value,
      modelValue: shared.value,
      'onUpdate:modelValue': (value: any) => shared.value = value,
    })),
  })

  const config = useConfig()

  function checkSync() {
    if (deepEqual(store.user.config, config.value)) return
    showSyncDialog.value = true
  }

  ctx.on('dispose', watch(config, async (value) => {
    if (!value || !store.user || !shared.value.sync) return
    await send('user/update', { config: value })
  }, { deep: true }))

  ctx.on('dispose', watch(() => shared.value.sync, async (value) => {
    if (value && store.user) checkSync()
  }))

  ctx.on('dispose', watch(() => store.user, (value, oldValue) => {
    showLoginDialog.value = false
    if (!value) {
      return router.push('/login')
    }

    if (shared.value.sync) checkSync()
    if (oldValue) return
    Object.assign(shared.value, pick(value, ['id', 'name', 'token', 'expiredAt']))
    message.success(`欢迎回来，${value.name || 'Koishi 用户'}！`)
    const from = router.currentRoute.value.redirectedFrom
    if (from && !from.path.startsWith('/login')) {
      router.push(from)
    } else {
      router.push('/profile')
    }
  }))
}
