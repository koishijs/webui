import { computed, ref, watch } from 'vue'
import { Dict, send, store, useStorage } from '@koishijs/client'

interface ManagerConfig {
  prefix: string
  override: Dict<string>
  hideWorkspace?: boolean
}

export const config = useStorage<ManagerConfig>('manager', 2, () => ({
  prefix: '^',
  override: {},
  hideWorkspace: true,
}))

export const overrideCount = computed(() => {
  return Object.values(config.value.override).filter(value => value !== undefined).length
})

watch(() => store.dependencies, (value) => {
  if (!value) return
  for (const key in config.value.override) {
    if (!config.value.override[key]) {
      if (!value[key]) delete config.value.override[key]
    } else if (value[key]?.request === config.value.override[key]) {
      delete config.value.override[key]
    }
  }
}, { immediate: true })

export const active = ref('')

export const refresh = computed(() => ({
  icon: 'refresh',
  label: '刷新',
  type: !store.market || store.market.progress < store.market.total ? 'spin disabled' : '',
  action: () => send('market/refresh'),
}))
