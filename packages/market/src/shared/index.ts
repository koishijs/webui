import { MarketProvider } from './market'
import { PackageProvider } from './packages'
import { ServiceProvider } from './service'
import { ConfigWriter } from './writer'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      market: MarketProvider
      packages: PackageProvider
      config: ConfigWriter
      services: ServiceProvider
    }
  }
}

export * from './market'
export * from './packages'
export * from './service'
export * from './writer'
