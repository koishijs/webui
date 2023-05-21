import { Context, icons, message, router, send, store } from '@koishijs/client'
import { config } from './utils'
import Login from './login.vue'
import Profile from './profile.vue'
import At from './icons/at.vue'
import Check from './icons/check.vue'
import Lock from './icons/lock.vue'
import SignIn from './icons/sign-in.vue'
import SignOut from './icons/sign-out.vue'
import UserFull from './icons/user-full.vue'
import BindDialog from './bind-dialog.vue'

icons.register('at', At)
icons.register('check', Check)
icons.register('lock', Lock)
icons.register('sign-in', SignIn)
icons.register('sign-out', SignOut)
icons.register('user-full', UserFull)

export default (ctx: Context) => {
  if (config.value.token && config.value.expiredAt > Date.now()) {
    send('login/token', config.value.id, config.value.token).catch(e => message.error(e.message))
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
}
