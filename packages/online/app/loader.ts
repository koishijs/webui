import { makeArray } from '@koishijs/core'
import { MarketResult } from '@koishijs/registry'
import { Loader, unwrapExports } from '@koishijs/loader'
import { global } from '@koishijs/client'
import process from 'process'

export * from '@koishijs/loader'

function resolveName(name: string) {
  if (name[0] === '@') {
    const [left, right] = name.split('/')
    return [`${left}/koishi-plugin-${right}`]
  } else {
    return [`@koishijs/plugin-${name}`, `koishi-plugin-${name}`]
  }
}

if (process.env.NODE_ENV !== 'development') {
  globalThis.process = process
}

class BrowserLoader extends Loader {
  public envData: any = {}
  public config: any = { plugins: {} }
  public market: MarketResult

  async init(filename?: string) {
    await super.init(filename)
    await this.prepare()
  }

  private async prepare() {
    if (process.env.NODE_ENV === 'development') return
    this.market = await fetch(global.endpoint + '/play.json').then(res => res.json())
    for (const object of this.market.objects) {
      this.cache[object.shortname] = `${global.endpoint}/modules/${object.name}/index.js`
    }
  }

  async resolve(name: string) {
    return this.cache[name]
  }

  async resolvePlugin(name: string) {
    const urls = process.env.NODE_ENV === 'development'
      ? resolveName(name).map(name => global.endpoint + `/modules/${name}/index.js`)
      : makeArray(this.cache[name])
    for (const url of urls) {
      try {
        return unwrapExports(await import(/* @vite-ignore */ url))
      } catch (err) {}
    }
    console.warn(`cannot resolve plugin ${name}`)
  }

  fullReload() {
    console.info('trigger full reload')
  }
}

export default new BrowserLoader()
