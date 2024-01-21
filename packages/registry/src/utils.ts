import { Dict } from 'cosmokit'
import { Manifest, PackageJson } from './types'

interface Ensure<T> {
  (value: any): T | undefined
  (value: any, fallback: T): T
}

export namespace Ensure {
  export const array: Ensure<string[]> = (value: any, fallback?: any) => {
    if (!Array.isArray(value)) return fallback
    return value.filter(x => typeof x === 'string')
  }

  export const dict: Ensure<Dict<string>> = (value: any, fallback?: any) => {
    if (typeof value !== 'object' || value === null) return fallback
    return Object.entries(value).reduce<Dict<string>>((dict, [key, value]) => {
      if (typeof value === 'string') dict[key] = value
      return dict
    }, {})
  }

  // https://github.com/microsoft/TypeScript/issues/15713#issuecomment-499474386
  const primitive = <T, >(type: string): Ensure<T> => (value: any, fallback?: T) => {
    if (typeof value !== type) return fallback
    return value
  }

  export const boolean = primitive<boolean>('boolean')
  export const number = primitive<number>('number')
  export const string = primitive<string>('string')
}

export function conclude(meta: PackageJson) {
  const manifest: Manifest = {
    hidden: Ensure.boolean(meta.koishi?.hidden),
    preview: Ensure.boolean(meta.koishi?.preview),
    insecure: Ensure.boolean(meta.koishi?.insecure),
    browser: Ensure.boolean(meta.koishi?.browser),
    category: Ensure.string(meta.koishi?.category),
    public: Ensure.array(meta.koishi?.public),
    description: Ensure.dict(meta.koishi?.description) || Ensure.string(meta.description, ''),
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
