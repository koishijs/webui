import { PackageProvider } from './packages'
import { ServiceProvider } from './services'
import { ConfigWriter } from './writer'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      packages: PackageProvider
      services: ServiceProvider
      config: ConfigWriter
    }
  }
}

export * from './packages'
export * from './services'
export * from './writer'
