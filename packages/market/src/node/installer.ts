import { Context, Dict, Logger, pick, Quester, Schema, Time, valueMap } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { PackageJson, Registry } from '@koishijs/registry'
import { resolve } from 'path'
import { promises as fsp } from 'fs'
import { loadManifest } from './utils'
import { compare, satisfies } from 'semver'
import {} from '@koishijs/loader'
import getRegistry from 'get-registry'
import which from 'which-pm-runs'
import spawn from 'execa'
import pMap from 'p-map'

declare module '@koishijs/plugin-console' {
  interface Events {
    'market/install'(deps: Dict<string>): Promise<number>
  }
}

const logger = new Logger('market')

export interface Dependency {
  /**
   * requested semver range
   * @example `^1.2.3` -> `1.2.3`
   */
  request: string
  /**
   * installed package version
   * @example `1.2.5`
   */
  resolved?: string
  /** whether it is a workspace package */
  workspace?: boolean
  /** all available versions */
  versions?: Dict<Partial<PackageJson>>
  /** latest version */
  latest?: string
}

class Installer extends DataService<Dict<Dependency>> {
  public http: Quester
  public registry: string

  private agent = which()?.name || 'npm'
  private manifest: PackageJson
  private task: Promise<Dict<Dependency>>

  constructor(public ctx: Context, public config: Installer.Config) {
    super(ctx, 'dependencies', { authority: 4 })
    this.manifest = loadManifest(this.cwd)

    ctx.console.addListener('market/install', this.installDep, { authority: 4 })
  }

  get cwd() {
    return this.ctx.baseDir
  }

  async prepare() {
    const { endpoint, timeout } = this.config
    this.registry = endpoint || await getRegistry()
    this.http = this.ctx.http.extend({ endpoint: this.registry, timeout })
  }

  async start() {
    await this.prepare()
  }

  private async _get() {
    const result = valueMap(this.manifest.dependencies, (request) => {
      return { request: request.replace(/^[~^]/, '') } as Dependency
    })
    await pMap(Object.keys(result), async (name) => {
      try {
        // some dependencies may be left with no local installation
        const meta = loadManifest(name)
        result[name].resolved = meta.version
        result[name].workspace = meta.$workspace
        if (meta.$workspace) return
      } catch {}

      try {
        const registry = await this.http.get<Registry>(`/${name}`)
        const entries = Object.values(registry.versions)
          .map(item => [item.version, pick(item, ['peerDependencies'])] as const)
          .sort(([a], [b]) => compare(b, a))
        result[name].latest = entries[0][0]
        result[name].versions = Object.fromEntries(entries)
      } catch (e) {
        logger.warn(e.message)
      }
    }, { concurrency: 10 })
    return result
  }

  async get(force = false) {
    if (!force && this.task) return this.task
    return this.task = this._get()
  }

  async exec(command: string, args: string[]) {
    return new Promise<number>((resolve) => {
      const child = spawn(command, args, { cwd: this.cwd })
      child.on('exit', (code) => resolve(code))
      child.on('error', () => resolve(-1))
      child.stderr.on('data', (data) => {
        data = data.toString().trim()
        if (!data) return
        for (const line of data.split('\n')) {
          logger.warn(line)
        }
      })
      child.stdout.on('data', (data) => {
        data = data.toString().trim()
        if (!data) return
        for (const line of data.split('\n')) {
          logger.info(line)
        }
      })
    })
  }

  async override(deps: Dict<string>) {
    const filename = resolve(this.cwd, 'package.json')
    for (const key in deps) {
      if (deps[key]) {
        this.manifest.dependencies[key] = deps[key]
      } else {
        delete this.manifest.dependencies[key]
      }
    }
    this.manifest.dependencies = Object.fromEntries(Object.entries(this.manifest.dependencies).sort((a, b) => a[0].localeCompare(b[0])))
    await fsp.writeFile(filename, JSON.stringify(this.manifest, null, 2))
  }

  installDep = async (deps: Dict<string>) => {
    const oldPayload = await this.get()
    await this.override(deps)

    let shouldInstall = false
    for (const name in deps) {
      const { resolved } = oldPayload[name] || {}
      if (deps[name] && resolved && satisfies(resolved, deps[name], { includePrerelease: true })) continue
      shouldInstall = true
      break
    }

    if (shouldInstall) {
      const args: string[] = []
      if (this.agent !== 'yarn') args.push('install')
      args.push('--registry', this.registry)
      const code = await this.exec(this.agent, args)
      if (code) return code
    }

    await this.refresh()
    const newPayload = await this.get()
    for (const name in oldPayload) {
      const { resolved, workspace } = oldPayload[name]
      if (workspace || !newPayload[name]) continue
      if (newPayload[name].resolved === resolved) continue
      if (!(require.resolve(name) in require.cache)) continue
      this.ctx.loader.fullReload()
    }
    this.ctx.console.packages.refresh()
    return 0
  }
}

namespace Installer {
  export interface Config {
    endpoint?: string
    timeout?: number
  }

  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().role('link').description('插件的下载源。默认跟随当前项目的 npm config。'),
    timeout: Schema.number().role('time').default(Time.second * 5).description('获取插件数据的超时时间。'),
  }).description('插件源设置')
}

export default Installer
