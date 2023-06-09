import { ref } from 'vue'
import { useStorage } from '@koishijs/client'
import { LoginToken } from '@koishijs/plugin-auth'

declare module '@koishijs/client' {
  interface Config {
    sync?: boolean
  }
}

interface SharedConfig extends Partial<LoginToken> {
  sync?: boolean
  name?: string
  authType: 0 | 1
  platform?: string
  userId?: string
  showPass?: boolean
  password?: string
}

export const shared = useStorage<SharedConfig>('auth', 2, () => ({
  authType: 0,
}))

export const showLoginDialog = ref(false)
export const showSyncDialog = ref(false)
