import { compare, intersects } from 'semver'
import { Awaitable, defineProperty, Dict, pick, Time } from 'cosmokit'
import { Ensure } from './utils'
import pMap from 'p-map'

export interface User {
  name?: string
  email: string
  url?: string
  username?: string
}

export interface BasePackage {
  name: string
  version: string
  description: string
}

export type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'

export interface PackageJson extends BasePackage, Partial<Record<DependencyType, Record<string, string>>> {
  main?: string
  module?: string
  browser?: string
  bin?: string | Dict<string>
  scripts?: Dict<string>
  exports?: PackageJson.Exports
  koishi?: Partial<Manifest>
  keywords: string[]
  engines?: Dict<string>
  os?: string[]
  cpu?: string[]
  overrides?: Dict<PackageJson.Overrides>
  peerDependenciesMeta?: Dict<PackageJson.PeerMeta>
}

export namespace PackageJson {
  export type Exports = string | { [key: string]: Exports }
  export type Overrides = string | { [key: string]: Overrides }

  export interface PeerMeta {
    optional?: boolean
  }
}

export interface IconSvg {
  type: 'svg'
  viewBox: string
  pathData: string
}

export interface Manifest {
  icon?: IconSvg
  hidden?: boolean
  preview?: boolean
  insecure?: boolean
  browser?: boolean
  category?: string
  public?: string[]
  exports?: Dict<string>
  description: string | Dict<string>
  service: Manifest.Service
  locales: string[]
}

export namespace Manifest {
  export interface Service {
    required: string[]
    optional: string[]
    implements: string[]
  }
}

export interface RemotePackage extends PackageJson {
  deprecated?: string
  author?: User
  contributors?: User[]
  maintainers: User[]
  license: string
  dist: RemotePackage.Dist
}

export namespace RemotePackage {
  export interface Dist {
    shasum: string
    integrity: string
    tarball: string
    fileCount: number
    unpackedSize: number
  }
}

export interface Registry extends BasePackage {
  versions: Dict<RemotePackage>
  time: Dict<string>
  license: string
  readme: string
  readmeFilename: string
}

export interface DatedPackage extends BasePackage {
  date: string
  category?: string
  insecure?: boolean
  portable?: boolean
  object?: SearchObject
}

export interface SearchPackage extends DatedPackage {
  links: Dict<string>
  author?: User
  contributors?: User[]
  keywords: string[]
  publisher: User
  maintainers: User[]
}

export interface Extension {
  score: Score
  rating: number
  verified: boolean
  publishSize?: number
  installSize?: number
  downloads?: {
    lastMonth: number
  }
}

export interface SearchObject extends Extension {
  package: SearchPackage
  searchScore: number
  ignored?: boolean
}

export interface Score {
  final: number
  detail: Score.Detail
}

export namespace Score {
  export interface Detail {
    quality: number
    popularity: number
    maintenance: number
  }
}

export interface SearchResult {
  total: number
  time: string
  objects: SearchObject[]
  version?: number
  forceTime?: number
}

export interface MarketResult {
  timestamp: number
  objects: AnalyzedPackage[]
}

export interface SharedPackage extends DatedPackage {
  versions: Dict<Partial<RemotePackage>>
}

export interface AnalyzedPackage extends SearchPackage, Extension {
  contributors: User[]
  shortname: string
  license: string
  manifest: Manifest
  createdAt: string
  updatedAt: string
  versions?: Dict<Partial<RemotePackage>>
}

export interface CollectConfig {
  step?: number
  margin?: number
  timeout?: number
  ignored?: string[]
}

export interface AnalyzeConfig {
  version: string
  concurrency?: number
  before?(object: SearchObject): void
  onRegistry?(registry: Registry, versions: RemotePackage[]): Awaitable<void>
  onSuccess?(item: AnalyzedPackage, object: SearchObject): Awaitable<void>
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

export function conclude(meta: PackageJson) {
  const manifest: Manifest = {
    hidden: Ensure.boolean(meta.koishi?.hidden),
    preview: Ensure.boolean(meta.koishi?.preview),
    insecure: Ensure.boolean(meta.koishi?.insecure),
    browser: Ensure.boolean(meta.koishi?.browser),
    category: Ensure.string(meta.koishi?.category),
    public: Ensure.array(meta.koishi?.public),
    description: Ensure.dict(meta.koishi?.description) || Ensure.string(meta.description),
    locales: Ensure.array(meta.koishi?.locales, []),
    service: {
      required: Ensure.array(meta.koishi?.service?.required, []),
      optional: Ensure.array(meta.koishi?.service?.optional, []),
      implements: Ensure.array(meta.koishi?.service?.implements, []),
    },
  }

  if (typeof manifest.description === 'string') {
    manifest.description = manifest.description.slice(0, 1024)
  } else if (manifest.description) {
    for (const key in manifest.description) {
      manifest.description[key] = manifest.description[key].slice(0, 1024)
    }
  }

  meta.keywords = Ensure.array(meta.keywords, []).filter((keyword) => {
    if (!keyword.includes(':')) return true
    if (keyword === 'market:hidden') {
      manifest.hidden = true
    } else if (keyword.startsWith('required:')) {
      manifest.service.required.push(keyword.slice(9))
    } else if (keyword.startsWith('optional:')) {
      manifest.service.optional.push(keyword.slice(9))
    } else if (keyword.startsWith('impl:')) {
      manifest.service.implements.push(keyword.slice(5))
    } else if (keyword.startsWith('locale:')) {
      manifest.locales.push(keyword.slice(7))
    }
  })

  return manifest
}

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
      const { name } = object.package
      const official = /^@koishijs\/plugin-[0-9a-z-]+$/.test(name)
      const community = /(^|\/)koishi-plugin-[0-9a-z-]+$/.test(name)
      return !object.ignored && !ignored.includes(name) && (official || community)
    })
    this.total = this.objects.length
  }

  public async process(object: SearchObject, range: string, onRegistry: AnalyzeConfig['onRegistry']) {
    const { name } = object.package
    const official = name.startsWith('@koishijs/plugin-')
    const registry = await this.request<Registry>(`/${name}`)
    const compatible = Object.values(registry.versions).filter((remote) => {
      const { peerDependencies = {} } = remote
      const declaredVersion = peerDependencies['koishi']
      try {
        return declaredVersion && intersects(range, declaredVersion)
      } catch {}
    })

    await onRegistry?.(registry, compatible)
    const versions = compatible
      .filter(item => !item.deprecated)
      .sort((a, b) => compare(b.version, a.version))
    if (!versions.length) return

    const latest = registry.versions[versions[0].version]
    const manifest = conclude(latest)

    const times = compatible.map(item => registry.time[item.version]).sort()
    const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    const keywords = (latest.keywords ?? [])
      .map(keyword => keyword.toLowerCase())
      .filter((keyword) => {
        return !keyword.includes(':')
          && !shortname.includes(keyword)
          && !stopWords.some(word => keyword.includes(word))
      })

    const analyzed: AnalyzedPackage = {
      name,
      manifest,
      shortname,
      keywords,
      createdAt: times[0],
      updatedAt: times[times.length - 1],
      verified: object.verified ?? official,
      category: object.package.category || manifest.category,
      insecure: object.package.insecure || manifest.insecure,
      versions: Object.fromEntries(versions.map(item => [item.version, item])),
      contributors: latest.contributors ?? (latest.author ? [latest.author] : []),
      ...pick(object, ['score', 'rating', 'downloads', 'installSize', 'publishSize']),
      ...pick(object.package, ['date', 'links', 'publisher', 'maintainers', 'portable']),
      ...pick(latest, ['version', 'description', 'license', 'author']),
    }
    defineProperty(analyzed, 'object', object)
    return analyzed
  }

  public async analyze(config: AnalyzeConfig) {
    const { concurrency = 5, version, before, onSuccess, onFailure, onSkipped, onRegistry, after } = config

    const result = await pMap(this.objects, async (object) => {
      if (object.ignored) return
      before?.(object)
      const { name } = object.package
      try {
        const analyzed = await this.process(object, version, onRegistry)
        if (analyzed) {
          await onSuccess?.(analyzed, object)
          return analyzed
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
