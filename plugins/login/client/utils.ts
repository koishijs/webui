import { ref, watch } from 'vue'
import { message, pick, router, store, useStorage } from '@koishijs/client'
import { LoginToken } from '@koishijs/plugin-login'

interface AuthConfig extends Partial<LoginToken> {
  name?: string
  authType: 0 | 1
  platform?: string
  userId?: string
  showPass?: boolean
  password?: string
}

export const config = useStorage<AuthConfig>('auth', 2, () => ({
  authType: 0,
}))

export const showDialog = ref(false)

watch(() => store.user, (value, oldValue) => {
  showDialog.value = false
  if (!value) {
    return router.push('/login')
  }

  if (oldValue) return
  Object.assign(config.value, pick(value, ['id', 'name', 'token', 'expire']))
  message.success(`欢迎回来，${value.name || 'Koishi 用户'}！`)
  const from = router.currentRoute.value.redirectedFrom
  if (from && !from.path.startsWith('/login')) {
    router.push(from)
  } else {
    router.push('/profile')
  }
})
