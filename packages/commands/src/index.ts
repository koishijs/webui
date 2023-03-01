import { Argv, Command, Context, Dict, Logger, remove, Schema } from 'koishi'
import CommandProvider from './service'

export * from './service'

interface Override {
  name?: string
  alias?: string[]
  create?: boolean
  options?: Dict<Argv.OptionDeclaration>
}

const Override: Schema<Override> = Schema.object({
  name: Schema.string(),
  alias: Schema.array(String),
  create: Schema.boolean(),
})

export interface CommandState {
  config: Command.Config
  options: Dict<Argv.OptionDeclaration>
}

export interface Snapshot {
  name: string
  parent: Command
  initial: CommandState
  override: CommandState
}

interface Config extends Override, Command.Config {}

const Config: Schema<string | Config, Config> = Schema.union([
  Override,
  Schema.transform(String, (name) => ({ name, alias: [] })),
])

const logger = new Logger('commands')

export class CommandManager {
  static filter = false
  static chema: Schema<Dict<string | Config>, Dict<Config>> = Schema.dict(Config).hidden()

  public snapshots: Dict<Snapshot> = {}

  constructor(private ctx: Context, private config: Dict<Config>) {
    for (const key in config) {
      const command = ctx.$commander.resolve(key)
      if (command) {
        this.accept(command, config[key])
      } else if (config[key].create) {
        const command = ctx.command(key)
        this.accept(command, config[key])
      }
    }

    ctx.on('command-added', (cmd) => {
      for (const key in config) {
        if (cmd !== ctx.$commander.resolve(key)) continue
        return this.accept(cmd, config[key])
      }
    })

    ctx.on('command-removed', (cmd) => {
      delete this.snapshots[cmd.name]
    })

    ctx.on('dispose', () => {
      for (const key in this.snapshots) {
        const { name, parent, initial } = this.snapshots[key]
        const cmd = ctx.$commander.resolve(name)
        cmd.config = initial.config
        Object.assign(cmd._options, initial.options)
        this.teleport(cmd, parent)
      }
    }, true)

    ctx.plugin(CommandProvider, this)
  }

  teleport(command: Command, parent: Command = null) {
    if (command.parent === parent) return
    if (command.parent) {
      remove(command.parent.children, command)
    }
    command.parent = parent
    parent?.children.push(command)
  }

  locate(command: Command, name: string) {
    const capture = name.match(/.*(?=[./])/)
    if (!capture) return name
    const parent = this.ctx.$commander.resolve(capture[0])
    if (capture[0] && !parent) {
      logger.warn('cannot find parent command', capture[0])
      return
    }
    this.teleport(command, parent)
    const rest = name.slice(capture[0].length)
    return rest[0] === '.' ? name : rest.slice(1)
  }

  update(name: string, override: CommandState, write?: boolean) {
    const command = this.ctx.$commander.resolve(name)
    const { initial } = this.snapshots[name]
    this.snapshots[name].override = override
    command.config = Object.assign({ ...initial.config }, override.config)
    for (const key in override.options) {
      const option = initial.options[key]
      if (!option) continue
      command._options[key] = Object.assign({ ...initial.options[key] }, override.options[key])
    }
    if (write) {
      const { alias } = this.config[name] || {}
      this.config[name] = {
        alias,
        options: override.options,
        ...override.config,
      }
      this.ctx.scope.update(this.config, false)
    }
  }

  accept(target: Command, config: Config) {
    const { name, alias = [], options = {}, ...rest } = config

    // create snapshot for restoration
    this.snapshots[target.name] = {
      name: target.name,
      parent: target.parent,
      initial: {
        options: target._options,
        config: target.config,
      },
    } as Snapshot

    // override command config
    this.update(target.name, {
      options,
      config: rest,
    })

    if (name) {
      const _name = this.locate(target, name)
      if (!_name) return
      // directly modify name of prototype
      target.displayName = _name
    }

    // cmd.alias() is self-disposable
    target = Object.create(target)
    target._disposables = this.ctx.scope.disposables
    for (const name of alias) {
      target.alias(name)
    }
  }
}

export default CommandManager
