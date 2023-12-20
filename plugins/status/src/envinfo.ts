import { Context, Dict, Schema, version } from 'koishi'
import { DataService } from '@koishijs/console'
import { readFile } from 'fs/promises'
import { helpers } from 'envinfo'
import which from 'which-pm-runs'

class EnvInfoProvider extends DataService<Dict<Dict<string>>> {
  private task: Promise<Dict<Dict<string>>>

  constructor(ctx: Context, public config: EnvInfoProvider.Config) {
    super(ctx, 'envinfo')
  }

  async _get(): Promise<Dict<Dict<string>>> {
    const [[, OS], [, CPU]] = await Promise.all([
      helpers.getOSInfo(),
      helpers.getCPUInfo(),
    ])
    const agent = which()
    const system = { OS, CPU }
    const binaries = {
      Node: process.versions.node,
    }
    if (agent) {
      if (agent.name === 'yarn') {
        agent.name = 'Yarn'
      }
      binaries[agent.name] = agent.version
    }
    // do not use `require` directly to avoid caching
    const metapath = require.resolve('@koishijs/console/package.json')
    const meta = await readFile(metapath, 'utf8').then(JSON.parse)
    const koishi = {
      Core: version,
      Console: meta.version,
    }
    if (process.env.KOISHI_AGENT) {
      const [name, version] = process.env.KOISHI_AGENT.split('/')
      koishi[name] = version
    }
    return { system, binaries, koishi }
  }

  async get() {
    if (!this.task) this.task = this._get()
    return this.task
  }
}

namespace EnvInfoProvider {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default EnvInfoProvider
