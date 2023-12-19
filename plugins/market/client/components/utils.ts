import { Awaitable, Dict, loading, message, send, socket, store, valueMap } from '@koishijs/client'
import { satisfies } from 'semver'
import { reactive, ref, watch } from 'vue'
import { active } from '../utils'

interface AnalyzeResult {
  peers: Dict<{
    request: string
    resolved: string
    result: 'success' | 'warning' | 'danger' | 'primary'
  }>
  result: 'success' | 'warning' | 'danger' | 'primary'
}

export function analyzeVersions(name: string): Dict<AnalyzeResult> {
  const versions = store.registry?.[name]
  if (!versions) return
  return valueMap(versions, (item) => {
    const peers = valueMap({ ...item.peerDependencies }, (request, name) => {
      const resolved = store.dependencies[name]?.resolved || store.packages?.[name]?.package.version
      const result: 'success' | 'warning' | 'danger' | 'primary' = !resolved
        ? item.peerDependenciesMeta?.[name]?.optional ? 'primary' : 'warning'
        : satisfies(resolved, request, { includePrerelease: true }) ? 'success' : 'danger'
      return { request, resolved, result }
    })
    let result: 'success' | 'warning' | 'danger' = 'success'
    for (const peer of Object.values(peers)) {
      if (peer.result === 'danger') {
        result = 'danger'
        break
      }
      if (peer.result === 'warning') {
        result = 'warning'
      }
    }
    if (item.deprecated) result = 'danger'
    return { peers, result }
  })
}

export const manualDeps = reactive<Dict<Dict<AnalyzeResult>>>({})

export const showManual = ref(false)
export const showConfirm = ref(false)

export async function install(override: Dict<string>, callback?: () => Awaitable<void>, forced?: boolean) {
  const instance = loading({
    text: '正在更新依赖……',
  })
  const dispose = watch(socket, () => {
    message.success('安装成功！')
    dispose()
    instance.close()
  })
  try {
    active.value = ''
    const code = await send('market/install', override, forced)
    if (code) {
      message.error('安装失败！')
    } else {
      await callback?.()
      message.success('安装成功！')
    }
  } catch (err) {
    console.error(err)
    message.error('安装超时！')
  } finally {
    dispose()
    instance.close()
  }
}
