import { AnalyzedPackage, User } from '@koishijs/registry'
import { InjectionKey } from 'vue'
import { Dict } from 'cosmokit'

export function getUsers(data: AnalyzedPackage) {
  const result: Record<string, User> = {}
  for (const user of data.contributors) {
    if (!user.email) continue
    result[user.email] ||= user
  }
  if (!data.maintainers.some(user => result[user.email])) {
    return data.maintainers
  }
  return Object.values(result)
}

const aWeekAgo = new Date(Date.now() - 1000 * 3600 * 24 * 7).toISOString()

export interface Badge {
  text: string
  query: string
  negate: string
  hidden?(config: MarketConfig, type: 'card' | 'filter'): boolean
}

export const badges: Dict<Badge> = {
  installed: {
    text: '已下载',
    query: 'is:installed',
    negate: 'not:installed',
    hidden(config, type) {
      return !config.installed || type === 'card'
    },
  },
  verified: {
    text: '官方认证',
    query: 'is:verified',
    negate: 'not:verified',
  },
  insecure: {
    text: '不安全',
    query: 'is:insecure',
    negate: 'not:insecure',
  },
  preview: {
    text: '开发中',
    query: 'is:preview',
    negate: 'not:preview',
  },
  newborn: {
    text: '近期新增',
    query: `created:>${aWeekAgo}`,
    negate: `created:<${aWeekAgo}`,
  },
}

interface Comparator {
  text: string
  icon: string
  hidden?: boolean
  compare(a: AnalyzedPackage, b: AnalyzedPackage): number
}

export const comparators: Dict<Comparator> = {
  rating: {
    text: '按评分',
    icon: 'star-full',
    compare: (a, b) => b.rating - a.rating,
  },
  download: {
    text: '按下载量',
    icon: 'download',
    compare: (a, b) => (b.downloads?.lastMonth ?? 0) - (a.downloads?.lastMonth ?? 0),
  },
  created: {
    text: '按创建时间',
    icon: 'heart-pulse',
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt),
  },
  updated: {
    text: '按更新时间',
    icon: 'tag',
    compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  },
}

export const categories = {
  core: '核心功能',
  adapter: '适配器',
  storage: '存储服务',
  extension: '扩展功能',
  console: '控制台',
  manage: '管理工具',
  preset: '行为预设',
  image: '图片服务',
  media: '资讯服务',
  tool: '实用工具',
  ai: '人工智能',
  meme: '趣味交互',
  game: '娱乐玩法',
  gametool: '游戏工具',
}

export interface MarketConfig {
  installed?(data: AnalyzedPackage): boolean
}

interface ValidateConfig extends MarketConfig {
  users?: User[]
}

export const kConfig = Symbol('market.config') as InjectionKey<MarketConfig>

export function getSorted(market: AnalyzedPackage[], words: string[]) {
  return market?.slice().filter((data) => {
    return !data.manifest.hidden || words.includes('show:hidden')
  }).sort((a, b) => {
    for (let word of words) {
      if (!word.startsWith('sort:')) continue
      let order = 1
      if (word.endsWith('-asc')) {
        order = -1
        word = word.slice(0, -4)
      } else if (word.endsWith('-desc')) {
        word = word.slice(0, -5)
      }
      const comparator = comparators[word.slice(5)]
      if (comparator) return comparator.compare(a, b) * order
    }
    return comparators.rating.compare(a, b)
  })
}

export function getFiltered(market: AnalyzedPackage[], words: string[], config?: MarketConfig) {
  return market.filter((data) => {
    const users = getUsers(data)
    return words.every((word) => {
      return validate(data, word, { ...config, users })
    })
  })
}

export function hasFilter(words: string[]) {
  return words.filter(w => w && !w.startsWith('show:') && !w.startsWith('sort:')).length > 0
}

export function resolveCategory(name?: string) {
  if (categories[name]) return name
  return 'other'
}

const operators = ['is', 'not', 'created', 'updated', 'impl', 'locale', 'using', 'category', 'email', 'show', 'sort']

export function validateWord(word: string) {
  if (!word.includes(':')) return true
  const [key] = word.split(':', 1)
  return operators.includes(key)
}

export function validate(data: AnalyzedPackage, word: string, config: ValidateConfig = {}) {
  const { locales, service } = data.manifest
  if (word.startsWith('impl:')) {
    return service.implements.includes(word.slice(5))
  } else if (word.startsWith('locale:')) {
    return locales.includes(word.slice(7))
  } else if (word.startsWith('using:')) {
    const name = word.slice(6)
    return service.required.includes(name) || service.optional.includes(name)
  } else if (word.startsWith('category:')) {
    return resolveCategory(data.category) === word.slice(9)
  } else if (word.startsWith('email:')) {
    const users = config.users ?? getUsers(data)
    return users.some(({ email }) => email === word.slice(6))
  } else if (word.startsWith('updated:<')) {
    return data.updatedAt < word.slice(9)
  } else if (word.startsWith('updated:>')) {
    return data.updatedAt >= word.slice(9)
  } else if (word.startsWith('created:<')) {
    return data.createdAt < word.slice(9)
  } else if (word.startsWith('created:>')) {
    return data.createdAt >= word.slice(9)
  } else if (word.startsWith('is:')) {
    if (word === 'is:verified') return data.verified
    if (word === 'is:insecure') return data.insecure
    if (word === 'is:preview') return !!data.manifest.preview
    if (word === 'is:installed') return !!config.installed?.(data)
    return false
  } else if (word.startsWith('not:')) {
    if (word === 'not:verified') return !data.verified
    if (word === 'not:insecure') return !data.insecure
    if (word === 'not:preview') return !data.manifest.preview
    if (word === 'not:installed') return !config.installed?.(data)
    return true
  } else if (word.includes(':')) {
    return true
  }

  if (data.shortname.includes(word)) return true
  return [
    ...data.keywords,
    ...Object.values(data.manifest.description),
  ].some(keyword => keyword.includes(word))
}

export function timeAgo(time: string) {
  const now = new Date()
  const input = new Date(time)
  const diff = now.getTime() - input.getTime()
  if (diff < 30000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前'
  return input.toLocaleDateString()
}
