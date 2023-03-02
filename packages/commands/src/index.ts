import { Argv, Command, Context, Dict, Logger, remove, Schema } from 'koishi'
import CommandProvider from './service'

export * from './service'

interface Override {
  name?: string
  aliases?: string[]
  create?: boolean
  options?: Dict<Argv.OptionDeclaration>
  config?: Command.Config
}

const Override: Schema<Override> = Schema.object({
  name: Schema.string(),
  aliases: Schema.array(String),
  create: Schema.boolean(),
  options: Schema.dict(null),
  config: Schema.any(),
})

export interface CommandState {
  aliases: string[]
  config: Command.Config
  options: Dict<Argv.OptionDeclaration>
}

export interface Snapshot {
  name: string
  parent: Command
  initial: CommandState
  override: CommandState
}

interface Config extends Override {}

const Config: Schema<string | Config, Config> = Schema.union([
  Override,
  Schema.transform(String, (name) => ({ name, alias: [] })),
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
        const { name, parent, initial, override } = this.snapshots[key]
        const cmd = ctx.$commander.resolve(name)
        cmd.config = initial.config
        cmd._aliases = initial.aliases
        Object.assign(cmd._options, initial.options)
        for (const alias of override.aliases) {
          if (cmd._aliases.includes(alias)) continue
          ctx.$commander._commands.delete(alias)
        }
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

  ensure(command: Command) {
    return this.snapshots[command.name] ||= {
      name: command.name,
      parent: command.parent,
      initial: {
        aliases: command._aliases,
        options: command._options,
        config: command.config,
      },
    } as Snapshot
  }

  locate(command: Command, path: string, write = false) {
    const capture = path.match(/.*(?=[./])/)
    let name = path
    if (capture) {
      const parent = this.ctx.$commander.resolve(capture[0])
      if (capture[0] && !parent) {
        logger.warn('cannot find parent command', capture[0])
        return
      }
      this.teleport(command, parent)
      const rest = path.slice(capture[0].length)
      name = rest[0] === '.' ? path : rest.slice(1)
    }
    command.displayName = name
    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].name = path
      this.write(command)
    }
  }

  write(command: Command) {
    const snapshot = this.ensure(command)
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

  update(name: string, override: CommandState, write = false) {
    // create snapshot for restoration
    const command = this.ctx.$commander.resolve(name)
    this.ensure(command)

    // override command config
    const { initial } = this.snapshots[name]
    this.snapshots[name].override = override
    command.config = Object.assign({ ...initial.config }, override.config)
    for (const key in override.options) {
      const option = initial.options[key]
      if (!option) continue
      command._options[key] = Object.assign({ ...initial.options[key] }, override.options[key])
    }

    // update config
    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].config = override.config
      this.config[command.name].options = override.options
      this.write(command)
    }
  }

  accept(target: Command, override: Override) {
    const { name, aliases = [], options = {}, config = {} } = override

    this.update(target.name, {
      options,
      config,
      aliases,
    })

    if (name) this.locate(target, name)
  }
}

export default CommandManager
