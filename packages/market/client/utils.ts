import { computed, ref } from 'vue'
import { createStorage, Dict, send, store } from '@koishijs/client'

interface ManagerConfig {
  prefix: string
  override: Dict<string>
  showInstalled?: boolean
  hideWorkspace?: boolean
}

export const config = createStorage<ManagerConfig>('manager', 2, () => ({
  prefix: '^',
  override: {},
  showInstalled: false,
  hideWorkspace: true,
}))

export const active = ref('')
export const showSelect = ref(false)

export const getMixedMeta = (name: string) => ({
  keywords: [],
  peerDependencies: {},
  ...store.market.data[name],
  ...store.packages?.[name],
})

export const menu = computed(() => [{
  icon: 'refresh',
  label: '刷新',
  type: !store.market || store.market.progress < store.market.total ? 'spin disabled' : '',
  action: () => send('market/refresh'),
}])
