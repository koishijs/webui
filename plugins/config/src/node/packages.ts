import { Context, Dict, EffectScope, Logger, pick, remove } from 'koishi'
import { conclude } from '@koishijs/registry'
import { promises as fsp } from 'fs'
import { dirname } from 'path'
import { unwrapExports } from '@koishijs/loader'
import { loadManifest } from './utils'
import * as shared from '../shared'

const logger = new Logger('config')

/** require without affecting the dependency tree */
function getExports(id: string) {
  const path = require.resolve(id)
  const keys = Object.keys(require.cache)
  let result = require.cache[path]
  if (!result) {
    require(path)
    result = require.cache[path]
    remove(module.children, result)
    for (const key in require.cache) {
      if (!keys.includes(key)) {
        delete require.cache[key]
      }
    }
  }
  return unwrapExports(result.exports)
}

export class PackageProvider extends shared.PackageProvider {
  cache: Dict<PackageProvider.Data> = {}
  task: Promise<void>

  constructor(ctx: Context) {
    super(ctx)

    ctx.console.addListener('config/request-runtime', async (name) => {
      const entry = require.resolve(name)
      const result = this.cache[entry]
      if (!result || result.runtime) return
      result.runtime = await this.parseExports(name, () => getExports(name))
      this.refresh(false)
    }, { authority: 4 })
  }

  update(state: EffectScope) {
    const entry = Object.keys(require.cache).find((key) => {
      return unwrapExports(require.cache[key].exports) === state.runtime.plugin
    })
    if (!this.cache[entry]?.runtime) return
    this.parseRuntime(state, this.cache[entry].runtime)
    this.refresh(false)
  }

  async prepare() {
    this.cache = {}
    let { baseDir } = this.ctx
    const tasks: Promise<void>[] = []
    while (1) {
      tasks.push(this.loadDirectory(baseDir))
      const parent = dirname(baseDir)
      if (baseDir === parent) break
      baseDir = parent
    }
    await Promise.all(tasks)
  }

  async get(forced = false) {
    if (forced) delete this.task
    await (this.task ||= this.prepare())

    // add app config
    const packages = Object.values(this.cache)
    packages.unshift({
      name: '',
      shortname: '',
      runtime: {
        schema: Context.Config,
      },
    })

    return Object.fromEntries(packages.filter(x => x).map(data => [data.name, data]))
  }

  private async loadDirectory(baseDir: string) {
    const base = baseDir + '/node_modules'
    const files = await fsp.readdir(base).catch(() => [])
    for (const name of files) {
      if (name.startsWith('koishi-plugin-')) {
        this.loadPackage(name)
      } else if (name.startsWith('@')) {
        const base2 = base + '/' + name
        const files = await fsp.readdir(base2).catch(() => [])
        for (const name2 of files) {
          if (name === '@koishijs' && name2.startsWith('plugin-') || name2.startsWith('koishi-plugin-')) {
            this.loadPackage(name + '/' + name2)
          }
        }
      }
    }
  }

  private async loadPackage(name: string) {
    try {
      // require.resolve(name) may be different from require.resolve(path)
      // because tsconfig-paths may resolve the path differently
      const entry = require.resolve(name)
      this.cache[entry] = await this.parsePackage(name, entry)
    } catch (error) {
      logger.warn('failed to resolve %c', name)
      logger.warn(error)
    }
  }

  private async parsePackage(name: string, entry: string) {
    const data = loadManifest(name)
    const result = pick(data, [
      'name',
      'version',
      'description',
    ]) as PackageProvider.Data

    // workspace packages are followed by symlinks
    result.workspace = data.$workspace
    result.shortname = data.name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    result.manifest = conclude(data)
    result.peerDependencies = { ...data.peerDependencies }
    result.peerDependenciesMeta = { ...data.peerDependenciesMeta }

    if (require.resolve[entry]) {
      result.runtime = await this.parseExports(name, () => unwrapExports(require.cache[entry].exports))
    }
    return result
  }

  async getManifest(name: string) {
    const filename = await this.ctx.loader.resolve(name + '/package.json')
    return conclude(JSON.parse(await fsp.readFile(filename, 'utf8')))
  }
}

export namespace PackageProvider {
  export interface Config {}

  export interface Data extends shared.PackageProvider.Data {}
}
