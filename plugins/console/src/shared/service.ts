import { Context, Service } from 'koishi'
import Console from '.'

export namespace DataService {
  export interface Options {
    immediate?: boolean
    authority?: number
  }
}

export abstract class DataService<T = never> extends Service {
  static filter = false

  static keys = new Set<string>()

  static define(name: keyof Console.Services) {
    this.keys.add(name)
    if (Object.prototype.hasOwnProperty.call(Console.prototype, name)) return
    const key = `console.${name}`
    Object.defineProperty(Console.prototype, name, {
      get(this: Console) {
        return this.caller[key]
      },
      set(this: Console, value) {
        this.caller[key] = value
      },
    })
  }

  public get(forced?: boolean): Promise<T> {
    return null
  }

  constructor(protected ctx: Context, protected key: keyof Console.Services, public options: DataService.Options = {}) {
    super(ctx, `console.${key}`, options.immediate)
    DataService.define(key)
  }

  start() {
    this.refresh()
  }

  async refresh(forced = true) {
    this.ctx.console?.broadcast('data', {
      key: this.key,
      value: await this.get(forced),
    }, this.options)
  }

  patch(value: T) {
    this.ctx.console?.broadcast('patch', {
      key: this.key,
      value,
    }, this.options)
  }
}
