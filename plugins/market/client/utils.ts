import { ref } from 'vue'
import { store } from '@koishijs/client'
import { gt } from 'semver'

export const active = ref('')

export function hasUpdate(name: string) {
  const versions = store.registry?.[name]
  const local = store.dependencies?.[name]
  if (!versions || local?.workspace) return
  try {
    return gt(Object.keys(versions)[0], local.resolved)
  } catch {}
}
