import { Awaitable, Dict, loading, message, send, socket, store, valueMap } from '@koishijs/client'
import { satisfies } from 'semver'
import { ref, watch } from 'vue'

export function analyzeVersions(name: string) {
  const { versions = {} } = store.dependencies[name] || store.market?.data[name]
  return valueMap(versions, (item) => {
    const peers = valueMap({ ...item.peerDependencies }, (request, name) => {
      const resolved = store.dependencies[name]?.resolved || store.packages[name]?.version
      const result = !resolved
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

export const showDialog = ref(false)

export async function install(override: Dict<string>, callback?: () => Awaitable<void>) {
  const instance = loading({
    text: '正在更新依赖……',
  })
  const dispose = watch(socket, () => {
    message.success('安装成功！')
    dispose()
    instance.close()
  })
  try {
    showDialog.value = false
    const code = await send('market/install', override)
    if (code) {
      message.error('安装失败！')
    } else {
      await callback?.()
      message.success('安装成功！')
    }
  } catch (err) {
    message.error('安装超时！')
  } finally {
    dispose()
    instance.close()
  }
}
