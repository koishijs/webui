import { computed, ref, Ref, watch } from 'vue'
import { Dict, store, useStorage } from '@koishijs/client'
import { gt } from 'semver'

interface ManagerConfig {
  prefix: string
  override: Dict<string>
  hideWorkspace?: boolean
}

export const config: Ref<ManagerConfig> = useStorage<ManagerConfig>('manager', 2, () => ({
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
    if (value[key]?.workspace) {
      delete config.value.override[key]
    } else if (!config.value.override[key] && !value[key]) {
      // package to be removed has been removed
      delete config.value.override[key]
    } else if (value[key]?.request === config.value.override[key]) {
      // package has been installed to the right version
      delete config.value.override[key]
    }
  }
}, { immediate: true })

export const active = ref('')

export function hasUpdate(name: string) {
  const versions = store.registry?.[name]
  const local = store.dependencies?.[name]
  if (!versions || local?.workspace) return
  try {
    return gt(Object.keys(versions)[0], local.resolved)
  } catch {}
}
