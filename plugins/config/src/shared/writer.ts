import { DataService } from '@koishijs/console'
import { Context, Dict, Logger, remove } from 'koishi'
import { Loader } from '@koishijs/loader'

declare module '@koishijs/console' {
  interface Events {
    'manager/app-reload'(config: any): void
    'manager/teleport'(source: string, target: string, index: number): void
    'manager/reload'(path: string, config: any, key?: string): void
    'manager/unload'(path: string, config: any, key?: string): void
    'manager/remove'(path: string): void
    'manager/group'(path: string): void
    'manager/alias'(path: string, alias: string): void
    'manager/meta'(path: string, config: any): void
  }
}

const logger = new Logger('loader')

// do not use lookbehind assertion for Safari compatibility
export function splitPath(path: string) {
  return path
    .replace(/@([^\/]+)\//g, '@$1\\')
    .split('/')
    .filter(Boolean)
    .map(part => part.replace(/\\/g, '/'))
}

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

export class ConfigWriter extends DataService<Context.Config & { $paths: Dict<number> }> {
  protected loader: Loader

  constructor(ctx: Context) {
    super(ctx, 'config', { authority: 4 })
    this.loader = ctx.loader

    ctx.console.addListener('manager/app-reload', (config) => {
      return this.reloadApp(config)
    }, { authority: 4 })

    for (const key of ['teleport', 'reload', 'unload', 'remove', 'group', 'meta', 'alias'] as const) {
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

  getGroup(plugins: any, ctx: Context, paths: Dict<number> = {}, path = '/') {
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
        result[key] = this.getGroup(value, fork.ctx, paths, path + key + '/')
      } else {
        paths[path + key] = fork.uid
      }
    }
    return result
  }

  async get() {
    const result: Context.Config & { $paths: Dict<number> } = { ...this.loader.config, $paths: {} }
    result.plugins = this.getGroup(result.plugins, this.loader.entry, result.$paths)
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

  private resolve(path: string) {
    const segments = splitPath(path)
    if (path.endsWith('/')) segments.push('')
    let ctx = this.loader.entry
    let name = segments.shift()
    while (segments.length) {
      ctx = ctx.scope[Loader.kRecord][name].ctx
      name = segments.shift()
    }
    return [ctx.scope, name] as const
  }

  async alias(path: string, alias: string) {
    const [parent, oldKey] = this.resolve(path)
    let config: any
    let newKey = oldKey.split(':', 1)[0] + (alias ? ':' : '') + alias
    const record = parent[Loader.kRecord]
    const fork = record[oldKey]
    if (fork) {
      delete record[oldKey]
      record[newKey] = fork
      fork.alias = alias
      fork.ctx.emit('internal/fork', fork)
      config = parent.config[oldKey]
    } else {
      newKey = '~' + newKey
      config = parent.config['~' + oldKey]
    }
    rename(parent.config, oldKey, newKey, config)
    await this.loader.writeConfig()
  }

  async meta(path: string, config: any) {
    const [parent, name] = this.resolve(path)
    const target = path ? parent.config[name] : parent.config
    for (const key of Object.keys(config)) {
      delete target[key]
      if (config[key] === null) {
        delete config[key]
      }
    }
    insertKey(target, config, Object.keys(target))
    await this.loader.writeConfig(true)
  }

  async reload(path: string, config: any, newKey?: string) {
    const [parent, oldKey] = this.resolve(path)
    if (newKey) {
      this.loader.unloadPlugin(parent.ctx, oldKey)
    }
    await this.loader.reloadPlugin(parent.ctx, newKey || oldKey, config)
    rename(parent.config, oldKey, newKey || oldKey, config)
    await this.loader.writeConfig()
  }

  async unload(path: string, config = {}, newKey?: string) {
    const [parent, oldKey] = this.resolve(path)
    this.loader.unloadPlugin(parent.ctx, oldKey)
    rename(parent.config, oldKey, '~' + (newKey || oldKey), config)
    await this.loader.writeConfig()
  }

  async remove(path: string) {
    const [parent, key] = this.resolve(path)
    this.loader.unloadPlugin(parent.ctx, key)
    delete parent.config[key]
    delete parent.config['~' + key]
    await this.loader.writeConfig()
  }

  async group(path: string) {
    const [parent, oldKey] = this.resolve(path)
    const config = parent.config[oldKey] = {}
    await this.loader.reloadPlugin(parent.ctx, oldKey, config)
    await this.loader.writeConfig()
  }

  async teleport(source: string, target: string, index: number) {
    const [parentS, oldKey] = this.resolve(source)
    const [parentT] = this.resolve(target ? target + '/' : '')

    // teleport fork
    const fork = parentS[Loader.kRecord][oldKey]
    if (fork && parentS !== parentT) {
      delete parentS[Loader.kRecord][oldKey]
      parentT[Loader.kRecord][oldKey] = fork
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
    const temp = dropKey(parentS.config, oldKey)
    const rest = Object.keys(parentT.config).slice(index)
    insertKey(parentT.config, temp, rest)
    await this.loader.writeConfig()
  }
}
