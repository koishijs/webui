import { compare, intersects } from 'semver'
import { Awaitable, defineProperty, Dict, Time } from 'cosmokit'
import { Registry, RemotePackage, SearchObject, SearchResult } from './types'
import { conclude } from './utils'
import pMap from 'p-map'

export * from './local'
export * from './types'
export * from './utils'

export interface CollectConfig {
  step?: number
  margin?: number
  timeout?: number
  ignored?: string[]
  endpoint?: string
}

export interface AnalyzeConfig {
  version: string
  concurrency?: number
  before?(object: SearchObject): void
  onRegistry?(registry: Registry, versions: RemotePackage[]): Awaitable<void>
  onSuccess?(object: SearchObject, versions: RemotePackage[]): Awaitable<void>
  onFailure?(name: string, reason: any): Awaitable<void>
  onSkipped?(name: string): Awaitable<void>
  after?(object: SearchObject): void
}

export interface ScanConfig extends CollectConfig, AnalyzeConfig {
  request<T>(url: string): Promise<T>
}

const stopWords = [
  'koishi',
  'plugin',
  'bot',
  'coolq',
  'cqhttp',
]

export interface RequestConfig {
  timeout?: number
}

export default interface Scanner extends SearchResult {
  progress: number
}

export default class Scanner {
  private cache: Dict<SearchObject>

  constructor(public request: <T>(url: string, config?: RequestConfig) => Promise<T>) {
    defineProperty(this, 'progress', 0)
    defineProperty(this, 'cache', {})
  }

  private async search(offset: number, config: CollectConfig) {
    const { step = 250, timeout = Time.second * 30 } = config
    const result = await this.request<SearchResult>(`/-/v1/search?text=koishi+plugin&size=${step}&from=${offset}`, { timeout })
    this.version = result.version
    for (const object of result.objects) {
      this.cache[object.package.name] = object
    }
    return result.total
  }

  public async collect(config: CollectConfig = {}) {
    const { step = 250, margin = 25, ignored = [] } = config
    this.cache = {}
    this.time = new Date().toUTCString()
    const total = await this.search(0, config)
    for (let offset = Object.values(this.cache).length; offset < total; offset += step - margin) {
      await this.search(offset - margin, config)
    }
    this.objects = Object.values(this.cache).filter((object) => {
      const { name, date } = object.package
      // `date` can be `undefined` due to a bug in https://registry.npmjs.org
      return date && !object.ignored && !ignored.includes(name) && Scanner.isPlugin(name)
    })
    this.total = this.objects.length
  }

  static isPlugin(name: string) {
    const official = /^@koishijs\/plugin-[0-9a-z-]+$/.test(name)
    const community = /(^|\/)koishi-plugin-[0-9a-z-]+$/.test(name)
    return official || community
  }

  static isCompatible(range: string, remote: Pick<RemotePackage, 'peerDependencies'>) {
    const { peerDependencies = {} } = remote
    const declaredVersion = peerDependencies['koishi']
    try {
      return declaredVersion && intersects(range, declaredVersion)
    } catch {}
  }

  public async process(object: SearchObject, range: string, onRegistry: AnalyzeConfig['onRegistry']) {
    const { name } = object.package
    const official = name.startsWith('@koishijs/plugin-')
    const registry = await this.request<Registry>(`/${name}`)
    const compatible = Object.values(registry.versions).filter((remote) => {
      return Scanner.isCompatible(range, remote)
    }).sort((a, b) => compare(b.version, a.version))

    await onRegistry?.(registry, compatible)
    const versions = compatible.filter(item => !item.deprecated)
    if (!versions.length) return

    const latest = registry.versions[versions[0].version]
    const manifest = conclude(latest)
    const times = compatible.map(item => registry.time[item.version]).sort()

    object.shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    object.verified = official
    object.manifest = manifest
    object.insecure = manifest.insecure
    object.category = manifest.category
    object.createdAt = times[0]
    object.updatedAt = times[times.length - 1]
    object.package.contributors ??= latest.author ? [latest.author] : []
    object.package.keywords = (latest.keywords ?? [])
      .map(keyword => keyword.toLowerCase())
      .filter((keyword) => {
        return !keyword.includes(':')
          && !object.shortname.includes(keyword)
          && !stopWords.some(word => keyword.includes(word))
      })
    return versions
  }

  public async analyze(config: AnalyzeConfig) {
    const { concurrency = 5, version, before, onSuccess, onFailure, onSkipped, onRegistry, after } = config

    const result = await pMap(this.objects, async (object) => {
      if (object.ignored) return
      before?.(object)
      const { name } = object.package
      try {
        const versions = await this.process(object, version, onRegistry)
        if (versions) {
          await onSuccess?.(object, versions)
          return versions
        } else {
          object.ignored = true
          await onSkipped?.(name)
        }
      } catch (error) {
        object.ignored = true
        await onFailure?.(name, error)
      } finally {
        this.progress += 1
        after?.(object)
      }
    }, { concurrency })

    return result.filter(isNonNullable)
  }
}

function isNonNullable<T>(value: T): value is Exclude<T, null | undefined | void> {
  return value !== null && value !== undefined
}
