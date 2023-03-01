import { DataService } from '@koishijs/plugin-console'
import { debounce } from 'throttle-debounce'
import { Command, Context, EffectScope } from 'koishi'
import { resolve } from 'path'
import { CommandManager, CommandState } from '.'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      commands: CommandProvider
    }
  }

  interface Events {
    'command/update'(name: string, config: CommandState): void
  }
}

export interface CommandData {
  name: string
  paths: string[]
  aliases: string[]
  children: CommandData[]
  initial: CommandState
  override: CommandState
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

  constructor(ctx: Context, private manager: CommandManager) {
    super(ctx, 'commands', { authority: 4 })

    ctx.on('command-added', this.update)
    ctx.on('command-removed', this.update)
    ctx.on('dispose', this.update.cancel)

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })

    ctx.console.addListener('command/update', (name: string, config: CommandState) => {
      manager.update(name, config, true)
      this.refresh()
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
      initial: this.manager.snapshots[command.name]?.initial || { config: command.config, options: command._options },
      override: this.manager.snapshots[command.name]?.override || { config: null, options: {} },
    }))
  }
}
