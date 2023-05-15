import { MarketProvider } from './market'
import { PackageProvider } from './packages'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      market: MarketProvider
      packages: PackageProvider
    }
  }
}

export * from './market'
export * from './packages'
