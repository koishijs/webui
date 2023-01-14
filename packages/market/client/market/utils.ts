import { store } from '@koishijs/client'
import { AnalyzedPackage, User } from '@koishijs/registry'
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

export function getUsers(data: AnalyzedPackage) {
  const result: Record<string, User> = {}
  for (const user of data.contributors) {
    result[user.email] ||= user
  }
  if (!data.maintainers.some(user => result[user.email])) {
    return [data.publisher]
  }
  return Object.values(result)
}

export function validate(data: AnalyzedPackage, word: string, users: User[]) {
  const { locales, service } = getMixedMeta(data.name).manifest
  if (word.startsWith('impl:')) {
    return service.implements.includes(word.slice(5))
  } else if (word.startsWith('locale:')) {
    return locales.includes(word.slice(7))
  } else if (word.startsWith('using:')) {
    const name = word.slice(6)
    return service.required.includes(name) || service.optional.includes(name)
  } else if (word.startsWith('email:')) {
    return users.some(({ email }) => email === word.slice(6))
  } else if (word.startsWith('before:')) {
    return data.createdAt < word.slice(7)
  } else if (word.startsWith('after:')) {
    return data.createdAt >= word.slice(6)
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
