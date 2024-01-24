import { Awaitable, Dict, loading, message, send, socket, store, valueMap } from '@koishijs/client'
import type { Registry } from '@koishijs/registry'
import { compare, satisfies } from 'semver'
import { reactive, ref, watch } from 'vue'
import { active } from '../utils'

export type ResultType = 'success' | 'warning' | 'danger' | 'primary'

interface AnalyzeResult {
  peers: Dict<PeerInfo>
  result: ResultType
}

export interface PeerInfo {
  request: string
  resolved: string
  result: ResultType
}

export function analyzeVersions(name: string, getVersion: (name: string) => string): Dict<AnalyzeResult> {
  const versions = store.registry?.[name] || manualDeps[name]?.versions
  if (!versions) return
  return valueMap(versions, (item) => {
    const peers = valueMap({ ...item.peerDependencies }, (request, name) => {
      const resolved = (getVersion ? getVersion(name) : null)
        ?? store.dependencies[name]?.resolved
        ?? store.packages?.[name]?.package.version
      const result: ResultType = !resolved
        ? item.peerDependenciesMeta?.[name]?.optional ? 'primary' : 'danger'
        : satisfies(resolved, request, { includePrerelease: true }) ? 'success' : 'danger'
      if (result === 'danger') console.log(name, request, resolved)
      return { request, resolved, result } as PeerInfo
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

export const manualDeps = reactive<Dict<Registry>>({})

export async function addManual(name: string) {
  const response = await fetch(`${store.market.registry}/${name}`)
  const data: Registry = await response.json()
  data.versions = Object.fromEntries(Object.entries(data.versions).sort((a, b) => compare(b[0], a[0])))
  return manualDeps[name] = data
}

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
