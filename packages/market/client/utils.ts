import { ref } from 'vue'
import { createStorage, store } from '@koishijs/client'

interface ManagerConfig {
  prefix: string
  showInstalled?: boolean
  hideWorkspace?: boolean
}

export const config = createStorage<ManagerConfig>('manager', 2, () => ({
  prefix: '^',
  showInstalled: false,
  hideWorkspace: true,
}))

export const active = ref('')

export const getMixedMeta = (name: string) => ({
  keywords: [],
  peerDependencies: {},
  ...store.market.data[name],
  ...store.packages[name],
})
