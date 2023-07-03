import { SearchResult } from '@koishijs/registry'
import { Loader } from '@koishijs/loader'
import { global } from '@koishijs/client'
import { Logger } from '@koishijs/core'
import { Buffer } from 'buffer'
import process from 'process'

export * from '@koishijs/loader'

if (process.env.NODE_ENV !== 'development') {
  globalThis.process = process
  globalThis.Buffer = Buffer
}

class BrowserLoader extends Loader {
  public envData: any = {}
  public config: any = { plugins: {} }
  public market: SearchResult

  constructor() {
    Logger.targets = []
    super()
  }

  async init(filename?: string) {
    await super.init(filename)
    await this.prepare()
  }

  private async prepare() {
    this.market = await fetch(global.endpoint + '/portable.json').then(res => res.json())
    for (const object of this.market.objects) {
      const shortname = object.package.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      this.cache[shortname] = `${global.endpoint}/modules/${object.package.name}/index.js`
    }
  }

  async import(name: string) {
    try {
      return await import(/* @vite-ignore */ this.cache[name])
    } catch (err) {
      console.warn(err)
    }
  }

  fullReload() {
    console.info('trigger full reload')
  }
}

export default new BrowserLoader()
