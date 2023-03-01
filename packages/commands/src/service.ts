import { DataService } from '@koishijs/plugin-console'
import { debounce } from 'throttle-debounce'
import { Argv, Command, Context, Dict, EffectScope } from 'koishi'
import { resolve } from 'path'
import { Snapshot } from '.'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      commands: CommandProvider
    }
  }

  interface Events {
    'command/config'(name: string, config: Command.Config): void
  }
}

export interface CommandData {
  name: string
  paths: string[]
  aliases: string[]
  children: CommandData[]
  options: Argv.OptionDeclarationMap
  config: Command.Config
  initial: Command.Config
}

function findAncestors(scope: EffectScope): string[] {
  if (scope.runtime === scope) {
    return [].concat(...scope.runtime.children.map(findAncestors))
  }
  const segments: string[] = []
  while (true) {
    const child = scope
    scope = scope.parent.scope
    if (scope === child) break
    const record = scope[Symbol.for('koishi.loader.record')]
    if (!record) continue
    const entry = Object.entries(record).find(([, value]) => value === child)
    if (!entry) return []
    segments.unshift(entry[0])
  }
  // slice leading group entry
  return [segments.slice(1).join('/')]
}

export default class CommandProvider extends DataService<CommandData[]> {
  static using = ['console'] as const

  cached: CommandData[]
  update = debounce(0, () => this.refresh())

  constructor(ctx: Context, private snapshots: Dict<Snapshot>) {
    super(ctx, 'commands', { authority: 4 })

    ctx.on('command-added', this.update)
    ctx.on('command-removed', this.update)
    ctx.on('dispose', this.update.cancel)

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })

    ctx.console.addListener('command/config', (name: string, config: Command.Config) => {
      console.log('update', name, config)
    })
  }

  async get(forced = false) {
    if (this.cached && !forced) return this.cached
    this.cached = this.traverse(this.ctx.$commander._commandList.filter(cmd => !cmd.parent))
    return this.cached
  }

  traverse(commands: Command[]): CommandData[] {
    return commands.map((command) => ({
      paths: findAncestors(command.ctx.scope),
      name: command.name,
      aliases: command._aliases,
      children: this.traverse(command.children),
      options: command._options,
      config: command.config,
      initial: this.snapshots[command.name]?.config,
    }))
  }
}
