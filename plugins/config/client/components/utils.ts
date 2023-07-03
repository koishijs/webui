import { Dict } from 'koishi'
import { computed, ref } from 'vue'
import { router, send, store } from '@koishijs/client'
import { PackageProvider } from '@koishijs/plugin-config'

export interface SettingsData {
  env: EnvInfo
  name: string
  local: PackageProvider.Data
  config: any
  current: Tree
}

interface DepInfo {
  required: boolean
}

interface PeerInfo {
  required: boolean
  active: boolean
}

export interface EnvInfo {
  impl: string[]
  using: Dict<DepInfo>
  peer: Dict<PeerInfo>
  warning?: boolean
}

export const select = ref<Tree>()

export const coreDeps = [
  '@koishijs/plugin-console',
  '@koishijs/plugin-config',
]

function getEnvInfo(name: string) {
  function setService(name: string, required: boolean) {
    if (services.has(name)) return
    if (name === 'console') return
    result.using[name] = { required }
  }

  const local = store.packages[name]
  const result: EnvInfo = { impl: [], using: {}, peer: {} }
  const services = new Set<string>()

  // check peer dependencies
  for (const name in local.package.peerDependencies ?? {}) {
    if (!name.includes('@koishijs/plugin-') && !name.includes('koishi-plugin-')) continue
    if (coreDeps.includes(name)) continue
    const required = !local.package.peerDependenciesMeta?.[name]?.optional
    const active = !!store.packages[name]?.runtime?.id
    result.peer[name] = { required, active }
    for (const service of store.packages[name]?.manifest?.service.implements ?? []) {
      services.add(service)
    }
  }

  // check implementations
  for (const name of local.manifest.service.implements) {
    if (name === 'adapter') continue
    result.impl.push(name)
  }

  // check services
  for (const name of local.manifest.service.required) {
    setService(name, true)
  }
  for (const name of local.manifest.service.optional) {
    setService(name, false)
  }

  // check reusability
  if (local.runtime?.id && !local.runtime?.forkable) {
    result.warning = true
  }

  // check schema
  if (!local.runtime?.schema) {
    result.warning = true
  }

  return result
}

export const envMap = computed(() => {
  return Object.fromEntries(Object
    .keys(store.packages)
    .filter(x => x)
    .map(name => [name, getEnvInfo(name)]))
})

declare module '@koishijs/client' {
  interface ActionContext {
    'config.current': Tree
    'config.tree': Tree
  }
}

export interface Tree {
  id: string
  alias: string
  label: string
  path: string
  config?: any
  target?: string
  parent?: Tree
  disabled?: boolean
  children?: Tree[]
}

export const current = ref<Tree>()

export const name = computed(() => {
  if (!current.value) return
  const { label, target } = current.value
  const shortname = target || label
  if (shortname.includes('/')) {
    const [left, right] = shortname.split('/')
    return [`${left}/koishi-plugin-${right}`].find(name => name in store.packages)
  }
  return [
    `@koishijs/plugin-${shortname}`,
    `koishi-plugin-${shortname}`,
  ].find(name => name in store.packages)
})

export const type = computed(() => {
  const env = envMap.value[name.value]
  if (!env) return
  if (env.warning && current.value.disabled) return 'warning'
  for (const name in env.using) {
    if (store.services?.[name]) {
      if (env.impl.includes(name)) return 'warning'
    } else {
      if (env.using[name].required) return 'warning'
    }
  }
})

function getTree(parent: Tree, plugins: any): Tree[] {
  const trees: Tree[] = []
  for (let key in plugins) {
    if (key.startsWith('$')) continue
    const config = plugins[key]
    const node = { config, parent } as Tree
    if (key.startsWith('~')) {
      node.disabled = true
      key = key.slice(1)
    }
    node.label = key.split(':', 1)[0]
    node.alias = key.slice(node.label.length + 1)
    node.id = node.path = parent.path + (parent.path ? '/' : '') + key
    if (key.startsWith('group:')) {
      node.children = getTree(node, config)
    }
    trees.push(node)
  }
  return trees
}

export const plugins = computed(() => {
  const root: Tree = {
    label: '全局设置',
    id: '',
    path: '',
    alias: '',
    config: store.config,
    children: [],
  }
  const data = [root]
  const expanded: string[] = []
  const paths: Dict<Tree> = {
    '': root,
  }
  for (const node of getTree(root, store.config.plugins)) {
    data.push(node)
    traverse(node)
  }
  function traverse(tree: Tree) {
    if (!tree.config?.$collapsed && tree.children) {
      expanded.push(tree.id)
    }
    paths[tree.path] = tree
    tree.children?.forEach(traverse)
  }
  return { data, paths, expanded }
})

export function setPath(oldPath: string, newPath: string) {
  if (oldPath === newPath) return
  for (const key of Object.keys(plugins.value.paths)) {
    if (key !== oldPath && !key.startsWith(oldPath + '/')) continue
    const tree = plugins.value.paths[key]
    tree.path = newPath + key.slice(oldPath.length)
    plugins.value.paths[tree.path] = tree
    delete plugins.value.paths[key]
  }
  router.replace('/plugins/' + newPath)
}

export function splitPath(path: string) {
  return path.split(/\/?(@[\w-]+\/[\w:-]+|[\w:-]+)\/?/).filter(Boolean)
}

export function addItem(path: string, action: 'group' | 'unload', name: string) {
  const id = Math.random().toString(36).slice(2, 8)
  if (path) path += '/'
  path += name + ':' + id
  send(`manager/${action}`, path)
  router.replace('/plugins/' + path)
}

export function removeItem(path: string) {
  send('manager/remove', path)
  const segments = splitPath(path)
  segments.pop()
  router.replace('/plugins/' + segments.join('/'))
}
