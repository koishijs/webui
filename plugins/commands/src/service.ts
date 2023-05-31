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
    'command/create'(name: string): void
    'command/remove'(name: string): void
    'command/update'(name: string, config: Pick<CommandState, 'config' | 'options'>): void
    'command/teleport'(name: string, parent: string): void
    'command/aliases'(name: string, aliases: string[]): void
  }
}

export interface CommandData {
  create: boolean
  name: string
  paths: string[]
  children: CommandData[]
  initial: CommandState
  override: CommandState
}

function findAncestors(scope: EffectScope, suffix: string[] = []): string[] {
  // root scope
  if (scope === scope.parent.scope) {
    return [suffix.slice(1).join('/')]
  }

  // runtime scope
  if (scope.runtime === scope) {
    return [].concat(...scope.runtime.children.map(child => findAncestors(child, suffix)))
  }

  const child = scope
  scope = scope.parent.scope
  const record = scope[Symbol.for('koishi.loader.record')]
  if (!record) return findAncestors(scope, suffix)
  const entry = Object.entries(record).find(([, value]) => value === child)
  if (!entry) return []
  return findAncestors(scope, [entry[0], ...suffix])
}

export default class CommandProvider extends DataService<CommandData[]> {
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
      const { command } = manager.ensure(name)
      manager.update(command, config, true)
      this.refresh()
    })

    ctx.console.addListener('command/teleport', (name: string, parent: string) => {
      const { command } = manager.ensure(name)
      manager.teleport(command, parent, true)
      this.refresh()
    })

    ctx.console.addListener('command/aliases', (name: string, aliases: string[]) => {
      const { command } = manager.ensure(name)
      manager.alias(command, aliases, true)
      this.refresh()
    })

    ctx.console.addListener('command/create', (name: string) => {
      manager.create(name)
      this.refresh()
    })

    ctx.console.addListener('command/remove', (name: string) => {
      manager.remove(name)
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
      children: this.traverse(command.children),
      create: this.manager.snapshots[command.name]?.create,
      initial: this.manager.snapshots[command.name]?.initial || { aliases: command._aliases, config: command.config, options: command._options },
      override: this.manager.snapshots[command.name]?.override || { aliases: command._aliases, config: null, options: {} },
    })).sort((a, b) => a.name.localeCompare(b.name))
  }
}
