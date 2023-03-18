import { Argv, Command, Context, Dict, Logger, remove, Schema } from 'koishi'
import CommandProvider from './service'

export * from './service'

interface Override extends Partial<CommandState> {
  name?: string
  create?: boolean
}

const Override: Schema<Override> = Schema.object({
  name: Schema.string(),
  create: Schema.boolean(),
  aliases: Schema.any(),
  options: Schema.dict(null),
  config: Schema.any(),
})

export interface CommandState {
  aliases: string[]
  config: Command.Config
  options: Dict<Argv.OptionDeclaration>
}

export interface Snapshot {
  command: Command
  parent: Command
  initial: CommandState
  override: CommandState
}

interface Config extends Override {}

const Config: Schema<string | Config, Config> = Schema.union([
  Override,
  Schema.transform(String, (name) => ({ name, aliases: [], config: {}, options: {} })),
])

const logger = new Logger('commands')

export class CommandManager {
  static filter = false
  static schema: Schema<Dict<string | Config>, Dict<Config>> = Schema.dict(Config).hidden()

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
        const { command, parent, initial, override } = this.snapshots[key]
        command.config = initial.config
        command._aliases = initial.aliases
        Object.assign(command._options, initial.options)
        for (const alias of override.aliases) {
          if (initial.aliases.includes(alias)) continue
          ctx.$commander._commands.delete(alias)
        }
        this._teleport(command, parent)
      }
    }, true)

    ctx.plugin(CommandProvider, this)
  }

  ensure(name: string) {
    const command = this.ctx.$commander.resolve(name)
    return this.snapshots[command.name] ||= {
      command,
      parent: command.parent,
      initial: {
        aliases: command._aliases,
        options: command._options,
        config: command.config,
      },
      override: {
        aliases: command._aliases,
        options: {},
        config: {},
      },
    }
  }

  _teleport(command: Command, parent: Command = null) {
    if (command.parent === parent) return
    if (command.parent) {
      remove(command.parent.children, command)
    }
    command.parent = parent
    parent?.children.push(command)
  }

  teleport(command: Command, name: string, write = false) {
    const parent = this.ctx.$commander.resolve(name)
    if (name && !parent) {
      logger.warn('cannot find parent command', name)
      return
    }
    this._teleport(command, parent)

    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].name = `${command.parent?.name || ''}/${command.displayName}`
      this.write(command)
    }
  }

  alias(command: Command, aliases: string[], write = false) {
    const { initial, override } = this.snapshots[command.name]
    command._aliases = override.aliases = aliases
    for (const alias of aliases) {
      this.ctx.$commander._commands.set(alias, command)
    }

    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].name = `${command.parent?.name || ''}/${command.displayName}`
      this.config[command.name].aliases = aliases.filter((name) => {
        return command.displayName !== name && !initial.aliases.includes(name)
      })
      this.write(command)
    }
  }

  update(command: Command, data: Pick<CommandState, 'config' | 'options'>, write = false) {
    const { initial, override } = this.snapshots[command.name]
    override.config = data.config || {}
    override.options = data.options || {}
    command.config = Object.assign({ ...initial.config }, override.config)
    for (const key in override.options) {
      const option = initial.options[key]
      if (!option) continue
      command._options[key] = Object.assign({ ...initial.options[key] }, override.options[key])
    }

    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].config = override.config
      this.config[command.name].options = override.options
      this.write(command)
    }
  }

  accept(target: Command, override: Override) {
    const { options = {}, config = {} } = override

    // create snapshot for restoration
    this.ensure(target.name)

    // override config and options
    this.update(target, { options, config })

    // teleport to new parent
    let name = override.name
    if (name?.includes('/')) {
      const [parent, child] = name.split('/')
      name = child
      this.teleport(target, parent)
    }

    // extend aliases and display name
    const aliases = [...new Set([
      ...name ? [name] : [],
      ...target._aliases,
      ...override.aliases || [],
    ])]
    this.alias(target, aliases)
  }

  write(command: Command) {
    const snapshot = this.ensure(command.name)
    const override = this.config[command.name]
    if (override.config && !Object.keys(override.config).length) {
      delete override.config
    }
    if (override.options && !Object.keys(override.options).length) {
      delete override.options
    }
    if (override.aliases && !override.aliases.length) {
      delete override.aliases
    }
    if (override.name) {
      const initial = (snapshot.parent?.name || '') + '/' + command.name
      if (override.name === initial || override.name === command.name) {
        delete this.config[command.name].name
      }
    }
    if (!Object.keys(override).length) {
      delete this.config[command.name]
    }
    this.ctx.scope.update(this.config, false)
  }
}

export default CommandManager
