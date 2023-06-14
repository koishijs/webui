import { Context, defineProperty, Dict, Logger, pick, Quester, Schema, Service, Time, valueMap } from 'koishi'
import Scanner, { PackageJson, Registry } from '@koishijs/registry'
import { resolve } from 'path'
import { promises as fsp, readFileSync } from 'fs'
import { compare, satisfies, valid } from 'semver'
import { Dependency } from '../shared'
import {} from '@koishijs/loader'
import getRegistry from 'get-registry'
import which from 'which-pm-runs'
import spawn from 'execa'
import pMap from 'p-map'

const logger = new Logger('market')

export interface LocalPackage extends PackageJson {
  private?: boolean
  $workspace?: boolean
}

export function loadManifest(name: string) {
  const filename = require.resolve(name + '/package.json')
  const meta: LocalPackage = JSON.parse(readFileSync(filename, 'utf8'))
  meta.dependencies ||= {}
  defineProperty(meta, '$workspace', !filename.includes('node_modules'))
  return meta
}

class Installer extends Service {
  public http: Quester
  public registry: string

  private agent = which()?.name || 'npm'
  private manifest: PackageJson
  private task: Promise<Dict<Dependency>>

  constructor(public ctx: Context, public config: Installer.Config) {
    super(ctx, 'installer')
    this.manifest = loadManifest(this.cwd)
  }

  get cwd() {
    return this.ctx.baseDir
  }

  async start() {
    const { endpoint, timeout } = this.config
    this.registry = endpoint || await getRegistry()
    this.http = this.ctx.http.extend({ endpoint: this.registry, timeout })
  }

  resolveName(name: string) {
    if (name.startsWith('@koishijs/plugin-')) return [name]
    if (name.match(/(^|\/)koishi-plugin-/)) return [name]
    if (name[0] === '@') {
      const [left, right] = name.split('/')
      return [`${left}/koishi-plugin-${right}`]
    } else {
      return [`@koishijs/plugin-${name}`, `koishi-plugin-${name}`]
    }
  }

  async findVersion(names: string[]) {
    const entries = await Promise.all(names.map(async (name) => {
      try {
        const registry = await this.http.get<Registry>(`/${name}`)
        const versions = Object.values(registry.versions).filter((remote) => {
          return !remote.deprecated && Scanner.isCompatible('4', remote)
        }).sort((a, b) => compare(b.version, a.version))
        if (!versions.length) return
        return { [name]: versions[0].version }
      } catch (e) {}
    }))
    return entries.find(Boolean)
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

      if (!valid(result[name].request)) {
        result[name].invalid = true
        return
      }

      try {
        const registry = await this.http.get<Registry>(`/${name}`)
        const entries = Object.values(registry.versions)
          .map(item => [item.version, pick(item, Dependency.keys)] as const)
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

  private _install() {
    const args: string[] = []
    if (this.agent !== 'yarn') args.push('install')
    args.push('--registry', this.registry)
    return this.exec(this.agent, args)
  }

  async install(deps: Dict<string>) {
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
      const code = await this._install()
      if (code) return code
    }

    const newPayload = await this.get(true)
    for (const name in oldPayload) {
      const { resolved, workspace } = oldPayload[name]
      if (workspace || !newPayload[name]) continue
      if (newPayload[name].resolved === resolved) continue
      if (!(require.resolve(name) in require.cache)) continue
      this.ctx.loader.fullReload()
    }

    return 0
  }
}

namespace Installer {
  export interface Config {
    endpoint?: string
    timeout?: number
  }

  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().role('link'),
    timeout: Schema.number().role('time').default(Time.second * 5),
  })
}

export default Installer
