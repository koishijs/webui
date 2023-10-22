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
  static using = ['console']

  public async get(forced?: boolean): Promise<T> {
    return null as T
  }

  constructor(protected ctx: Context, protected key: keyof Console.Services, public options: DataService.Options = {}) {
    super(ctx, `console.${key}`, options.immediate)
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
