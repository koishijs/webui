import { Dict } from 'cosmokit'

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

export type DependencyKey = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
export type DependencyMetaKey = 'deprecated' | 'peerDependencies' | 'peerDependenciesMeta'

export interface PackageJson extends BasePackage, Partial<Record<DependencyKey, Record<string, string>>> {
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
}

export interface SearchPackage extends DatedPackage, Pick<RemotePackage, DependencyMetaKey> {
  links: Dict<string>
  author?: User
  contributors?: User[]
  keywords: string[]
  publisher: User
  maintainers: User[]
}

export interface SearchObject {
  shortname: string
  package: SearchPackage
  searchScore: number
  score: Score
  rating: number
  verified: boolean
  workspace?: boolean
  category?: string
  portable?: boolean
  insecure?: boolean
  ignored?: boolean
  license: string
  manifest: Manifest
  createdAt: string
  updatedAt: string
  publishSize?: number
  installSize?: number
  downloads?: {
    lastMonth: number
  }
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
