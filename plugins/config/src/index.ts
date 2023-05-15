import { ConfigWriter } from './writer'
import { ServiceProvider } from './service'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      config: ConfigWriter
      services: ServiceProvider
    }
  }
}
