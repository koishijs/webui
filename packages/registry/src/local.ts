/// <reference types="@types/node" />

import { defineProperty, Dict, pick } from 'cosmokit'
import { dirname } from 'path'
import { readdir, readFile } from 'fs/promises'
import { PackageJson, SearchObject, SearchResult } from './types'
import { conclude } from './utils'

export interface LocalScanner extends SearchResult {}

export class LocalScanner {
  private cache: Dict<Promise<SearchObject>>
  private task: Promise<SearchObject[]>

  constructor(public baseDir: string) {
    defineProperty(this, 'cache', {})
  }

  onError(reason: any, name: string) {}

  async _collect() {
    this.cache = {}
    let root = this.baseDir
    const tasks: Promise<void>[] = []
    while (1) {
      tasks.push(this.loadDirectory(root))
      const parent = dirname(root)
      if (root === parent) break
      root = parent
    }
    await Promise.all(tasks)
    return Promise.all(Object.values(this.cache))
  }

  async collect(forced = false) {
    if (forced) delete this.task
    this.objects = await (this.task ||= this._collect())
  }

  private async loadDirectory(baseDir: string) {
    const base = baseDir + '/node_modules'
    const files = await readdir(base).catch(() => [])
    for (const name of files) {
      if (name.startsWith('koishi-plugin-')) {
        this.cache[name] ||= this.loadPackage(name)
      } else if (name.startsWith('@')) {
        const base2 = base + '/' + name
        const files = await readdir(base2).catch(() => [])
        for (const name2 of files) {
          if (name === '@koishijs' && name2.startsWith('plugin-') || name2.startsWith('koishi-plugin-')) {
            this.cache[name + '/' + name2] ||= this.loadPackage(name + '/' + name2)
          }
        }
      }
    }
  }

  private async loadPackage(name: string) {
    try {
      return await this.parsePackage(name)
    } catch (error) {
      this.onError(error, name)
    }
  }

  private async loadManifest(name: string) {
    const filename = require.resolve(name + '/package.json')
    const meta: PackageJson = JSON.parse(await readFile(filename, 'utf8'))
    meta.peerDependencies ||= {}
    meta.peerDependenciesMeta ||= {}
    return [meta, !filename.includes('node_modules')] as const
  }

  protected async parsePackage(name: string) {
    const [data, workspace] = await this.loadManifest(name)
    return {
      workspace,
      manifest: conclude(data),
      shortname: data.name.replace(/(koishi-|^@koishijs\/)plugin-/, ''),
      package: pick(data, [
        'name',
        'version',
        'peerDependencies',
        'peerDependenciesMeta',
      ]),
    } as SearchObject
  }
}
