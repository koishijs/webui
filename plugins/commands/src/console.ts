import { DataService } from '@koishijs/plugin-console'
import { debounce } from 'throttle-debounce'
import { Command, Context } from 'koishi'
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

export default class CommandProvider extends DataService<CommandData[]> {
  cached: CommandData[]
  update = debounce(0, () => this.refresh())

  constructor(ctx: Context, private manager: CommandManager) {
    super(ctx, 'commands', { authority: 4 })

    ctx.on('command-added', this.update)
    ctx.on('command-removed', this.update)
    ctx.on('dispose', this.update.cancel)

    ctx.console.addEntry(process.env.KOISHI_BASE ? [
      process.env.KOISHI_BASE + '/dist/index.js',
      process.env.KOISHI_BASE + '/dist/style.css',
    ] : process.env.KOISHI_ENV === 'browser' ? [
      // @ts-ignore
      import.meta.url.replace(/\/src\/[^/]+$/, '/client/index.ts'),
    ] : {
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
      name: command.name,
      children: this.traverse(command.children),
      create: this.manager.snapshots[command.name]?.create,
      initial: this.manager.snapshots[command.name]?.initial || { aliases: command._aliases, config: command.config, options: command._options },
      override: this.manager.snapshots[command.name]?.override || { aliases: command._aliases, config: null, options: {} },
      paths: this.ctx.loader?.paths(command.ctx.scope) || [],
    })).sort((a, b) => a.name.localeCompare(b.name))
  }
}
