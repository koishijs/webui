import { Dict } from 'cosmokit'

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

  const primitive = <T>(type: string): Ensure<T> => (value: any, fallback?: T) => {
    if (typeof value !== type) return fallback
    return value
  }

  export const boolean = primitive<boolean>('boolean')
  export const number = primitive<number>('number')
  export const string = primitive<string>('string')
}
