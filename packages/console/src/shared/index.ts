import { Context, Service } from 'koishi'
import { DataService } from './service'
import NodeConsole from '../node'

export * from './service'

type NestedServices = {
  [K in keyof Console.Services as `console.${K}`]: Console.Services[K]
}

declare module 'koishi' {
  interface Context extends NestedServices {
    console: NodeConsole
  }
}

export interface Console extends Console.Services {}

export interface Entry {
  dev: string
  prod: string
}

export abstract class Console extends Service {
  constructor(public ctx: Context) {
    super(ctx, 'console', true)
  }

  abstract addEntry(entry: string | Entry): void
  abstract addListener<K extends keyof Events>(event: K, callback: Events[K], options?: DataService.Options): void
  abstract broadcast(type: string, body: any, options?: DataService.Options): void
}

export interface Events {}

export namespace Console {
  export interface Services {}
}

export default Console
