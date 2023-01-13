import { store } from '@koishijs/client'
import { AnalyzedPackage } from '@koishijs/registry'
import { getMixedMeta } from '../utils'

export const categories = {
  all: '所有插件',
  other: '未分类',
  console: '控制台',
  business: '业务功能',
  storage: '存储服务',
  tool: '基础工具',
  game: '娱乐功能',
}

export function resolveCategory(name: string) {
  if (categories[name]) return name
  return 'other'
}

export function getKeywords(name: string) {
  return store.packages[name]?.keywords || store.market.data[name].keywords || []
}

export function validate(data: AnalyzedPackage, word: string) {
  const { locales, service } = getMixedMeta(data.name).manifest
  if (word.startsWith('impl:')) {
    return service.implements.includes(word.slice(5))
  } else if (word.startsWith('locale:')) {
    return locales.includes(word.slice(7))
  } else if (word.startsWith('using:')) {
    const name = word.slice(6)
    return service.required.includes(name) || service.optional.includes(name)
  } else if (word.startsWith('user:')) {
    return data.contributors.some(user => user.name === word.slice(5))
  } else if (word.startsWith('is:')) {
    if (word === 'is:verified') return data.verified
    if (word === 'is:insecure') return data.insecure
    if (word === 'is:preview') return data.manifest.preview
    return false
  } else if (word.startsWith('not:')) {
    if (word === 'not:verified') return !data.verified
    if (word === 'not:insecure') return !data.insecure
    if (word === 'not:preview') return !data.manifest.preview
    return true
  } else if (word.startsWith('show:')) {
    return true
  }

  if (data.shortname.includes(word)) return true
  return data.keywords.some((keyword) => {
    return !keyword.includes(':') && keyword.includes(word)
  })
}
