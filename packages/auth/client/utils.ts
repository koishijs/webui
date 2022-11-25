import { ref, watch } from 'vue'
import { createStorage, message, router, store } from '@koishijs/client'
import { UserAuth } from '@koishijs/plugin-auth'

interface AuthConfig extends Partial<UserAuth> {
  authType: 0 | 1
  platform?: string
  userId?: string
  showPass?: boolean
  password?: string
}

export const config = createStorage<AuthConfig>('auth', 1, () => ({
  authType: 0,
}))

export const showDialog = ref(false)

watch(() => store.user, (value, oldValue) => {
  showDialog.value = false
  if (!value) {
    return router.push('/login')
  }

  if (oldValue) return
  message.success(`欢迎回来，${value.name || 'Koishi 用户'}！`)
  Object.assign(config, value)
  const from = router.currentRoute.value.redirectedFrom
  if (from && !from.path.startsWith('/login')) {
    router.push(from)
  } else {
    router.push('/profile')
  }
})
