import { DataService } from '@koishijs/console'
import { Context, Logger, remove } from 'koishi'
import { Loader } from '@koishijs/loader'

declare module '@koishijs/console' {
  interface Events {
    'manager/app-reload'(config: any): void
    'manager/teleport'(source: string, key: string, target: string, index: number): void
    'manager/reload'(parent: string, key: string, config: any): void
    'manager/unload'(parent: string, key: string, config: any): void
    'manager/remove'(parent: string, key: string): void
    'manager/meta'(ident: string, config: any): void
  }
}

const logger = new Logger('loader')

function insertKey(object: {}, temp: {}, rest: string[]) {
  for (const key of rest) {
    temp[key] = object[key]
    delete object[key]
  }
  Object.assign(object, temp)
}

function rename(object: any, old: string, neo: string, value: any) {
  const keys = Object.keys(object)
  const index = keys.findIndex(key => key === old || key === '~' + old)
  const rest = index < 0 ? [] : keys.slice(index + 1)
  const temp = { [neo]: value }
  delete object[old]
  delete object['~' + old]
  insertKey(object, temp, rest)
}

function dropKey(plugins: {}, name: string) {
  if (!(name in plugins)) {
    name = '~' + name
  }
  const value = plugins[name]
  delete plugins[name]
  return { [name]: value }
}

export class ConfigWriter extends DataService<Context.Config> {
  protected loader: Loader

  constructor(ctx: Context) {
    super(ctx, 'config', { authority: 4 })
    this.loader = ctx.loader

    ctx.console.addListener('manager/app-reload', (config) => {
      return this.reloadApp(config)
    }, { authority: 4 })

    for (const key of ['teleport', 'reload', 'unload', 'remove', 'meta'] as const) {
      ctx.console.addListener(`manager/${key}`, async (...args: any[]) => {
        try {
          await this[key].apply(this, args)
        } catch (error) {
          logger.error(error)
          throw new Error('failed')
        }
      }, { authority: 4 })
    }

    ctx.on('config', () => this.refresh())
  }

  getGroup(plugins: any, ctx: Context) {
    const result = { ...plugins }
    for (const key in plugins) {
      if (key.startsWith('$')) continue
      const value = plugins[key]
      const name = key.split(':', 1)[0].replace(/^~/, '')

      if (!this.loader.isTruthyLike(value?.$if)) {
        // $if-disabled plugins should not be displayed
        // https://github.com/koishijs/webui/issues/249
        delete result[key]
        continue
      }

      // handle plugin groups
      const fork = ctx.scope[Loader.kRecord][key]
      if (!fork) continue
      if (name === 'group') {
        result[key] = this.getGroup(value, fork.ctx)
      }
    }
    return result
  }

  async get() {
    const result: Context.Config = { ...this.loader.config }
    result.plugins = this.getGroup(result.plugins, this.loader.entry)
    return result
  }

  async reloadApp(config: any) {
    delete config.$paths
    const plugins = this.loader.config.plugins
    this.loader.config = config
    this.loader.config.plugins = plugins
    await this.loader.writeConfig()
    this.loader.fullReload()
  }

  private resolveFork(ident: string) {
    if (!ident) return this.loader.entry.scope
    for (const main of this.ctx.registry.values()) {
      for (const fork of main.children) {
        if (fork.key === ident) return fork
      }
    }
  }

  private resolveConfig(ident: string, config = this.loader.config.plugins): [any, string] {
    for (const key in config) {
      const [name] = key.split(':', 1)
      if (key.slice(name.length + 1) === ident) return [config, key]
      if (name === 'group' || name === '~group') {
        return this.resolveConfig(ident, config[key])
      }
    }
    throw new Error('plugin not found')
  }

  async meta(ident: string, config: any) {
    const [parent, key] = this.resolveConfig(ident)
    const target = parent[key]
    for (const key of Object.keys(config)) {
      delete target[key]
      if (config[key] === null) {
        delete config[key]
      }
    }
    insertKey(target, config, Object.keys(target))
    await this.loader.writeConfig(true)
  }

  async reload(parent: string, key: string, config: any) {
    const scope = this.resolveFork(parent)
    await this.loader.reload(scope.ctx, key, config)
    rename(scope.config, key, key, config)
    await this.loader.writeConfig()
  }

  async unload(parent: string, key: string, config = {}) {
    const scope = this.resolveFork(parent)
    this.loader.unload(scope.ctx, key)
    rename(scope.config, key, '~' + key, config)
    await this.loader.writeConfig()
  }

  async remove(parent: string, key: string) {
    const scope = this.resolveFork(parent)
    this.loader.unload(scope.ctx, key)
    delete scope.config[key]
    delete scope.config['~' + key]
    await this.loader.writeConfig()
  }

  async teleport(source: string, key: string, target: string, index: number) {
    const parentS = this.resolveFork(source)
    const parentT = this.resolveFork(target)

    // teleport fork
    const fork = parentS?.[Loader.kRecord]?.[key]
    if (fork && parentS !== parentT) {
      delete parentS[Loader.kRecord][key]
      parentT[Loader.kRecord][key] = fork
      remove(parentS.disposables, fork.dispose)
      parentT.disposables.push(fork.dispose)
      fork.parent = parentT.ctx
      Object.setPrototypeOf(fork.ctx, parentT.ctx)
      fork.ctx.emit('internal/fork', fork)
      if (fork.runtime.using.some(name => parentS[name] !== parentT[name])) {
        fork.restart()
      }
    }

    // teleport config
    const temp = dropKey(parentS.config, key)
    const rest = Object.keys(parentT.config).slice(index)
    insertKey(parentT.config, temp, rest)
    await this.loader.writeConfig()
  }
}
