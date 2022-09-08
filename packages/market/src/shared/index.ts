import { MarketProvider } from './market'
import { PackageProvider } from './packages'
import { ConfigWriter } from './writer'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      market: MarketProvider
      packages: PackageProvider
      config: ConfigWriter
    }
  }
}

export * from './market'
export * from './packages'
export * from './writer'
