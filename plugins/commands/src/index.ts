import { Argv, clone, Command, Context, deepEqual, Dict, filterKeys, mapValues, remove, Schema } from 'koishi'
import ConsoleExtension from './console'
import CommandExtension from './command'

export * from './console'

interface Override extends Partial<CommandState> {
  name?: string
  create?: boolean
}

const Override: Schema<Override> = Schema.object({
  name: Schema.string(),
  create: Schema.boolean(),
  aliases: Schema.union([
    Schema.dict(null),
    Schema.transform(Schema.array(String), (aliases) => {
      return Object.fromEntries(aliases.map((name) => [name, {}]))
    }),
  ]),
  options: Schema.dict(null),
  config: Schema.any(),
})

export interface CommandState {
  aliases: Dict<false | Command.Alias>
  config: Command.Config
  options: Dict<Argv.OptionDeclaration>
}

export interface Snapshot {
  create?: boolean
  pending?: string
  command: Command
  parent: Command
  initial: CommandState
  override: CommandState
}

interface Config extends Override {}

const Config: Schema<string | Config, Config> = Schema.union([
  Override,
  Schema.transform(String, (name) => ({ name, aliases: {}, config: {}, options: {} })),
])

export class CommandManager {
  static filter = false
  static schema: Schema<Dict<string | Config>, Dict<Config>> = Schema.dict(Config).hidden()

  private _tasks: Dict<() => void> = Object.create(null)

  public snapshots: Dict<Snapshot> = Object.create(null)

  constructor(private ctx: Context, private config: Dict<Config>) {
    for (const key in config) {
      const command = ctx.$commander.get(key, true)
      if (command) {
        this.accept(command, config[key])
      } else if (config[key].create) {
        const command = ctx.command(key)
        this.accept(command, config[key])
      }
    }

    // The command API is chained, so it's better to wait for the next tick
    // because the command may not be fully initialized at this moment.
    ctx.on('command-added', async (cmd) => {
      this.init(cmd)
      for (const { command, pending } of Object.values(this.snapshots)) {
        const parent = this.ctx.$commander.get(pending, true)
        if (!parent || !pending) continue
        this.snapshots[command.name].pending = null
        this._teleport(command, parent)
      }
    })

    ctx.on('command-updated', (cmd) => {
      this.init(cmd)
    })

    ctx.on('command-removed', (cmd) => {
      delete this._tasks[cmd.name]
      delete this.snapshots[cmd.name]
      for (const command of cmd.children) {
        const parent = this.snapshots[command.name]?.parent
        if (!parent || parent === cmd) continue
        this._teleport(command, parent)
      }
    })

    ctx.on('dispose', () => {
      this._tasks = Object.create(null)
      for (const key in this.snapshots) {
        const { command, parent, initial } = this.snapshots[key]
        command.config = initial.config
        // initial aliases cannot include false values
        command._aliases = initial.aliases as any
        Object.assign(command._options, initial.options)
        this._teleport(command, parent)
      }
    }, true)

    ctx.plugin(ConsoleExtension, this)
    ctx.plugin(CommandExtension, this)
  }

  init(command: Command) {
    if (!this.config[command.name]) return
    this._tasks[command.name] ||= this.ctx.setTimeout(() => {
      delete this._tasks[command.name]
      this.accept(command, this.config[command.name], true)
    }, 0)
  }

  ensure(name: string, create?: boolean, patch?: boolean) {
    const command = this.ctx.$commander.get(name, true)
    const snapshot = this.snapshots[command.name]
    if (patch && snapshot) {
      // Aliases and options may be modified by other plugins.
      snapshot.initial.options = mapValues(command._options, (option, key) => {
        return snapshot.initial.options[key] || clone(option)
      })
      for (const key of Object.keys(command._aliases)) {
        if (snapshot.initial.aliases[key]) continue
        if (snapshot.override.aliases[key]) continue
        snapshot.initial.aliases[key] = command._aliases[key]
      }
      snapshot.override.aliases = command._aliases
      return snapshot
    }
    return this.snapshots[command.name] ||= {
      create,
      command,
      parent: command.parent,
      initial: {
        aliases: { ...command._aliases },
        options: clone(command._options),
        config: clone(command.config),
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
  }

  teleport(command: Command, name: string, write = false) {
    this.snapshots[command.name].pending = null
    const parent = this.ctx.$commander.get(name, true)
    if (name && !parent) {
      this.snapshots[command.name].pending = name
    } else {
      this._teleport(command, parent)
    }

    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].name = `${name || ''}/${command.displayName}`
      this.write(command)
    }
  }

  alias(command: Command, aliases: Dict<false | Command.Alias>, write = false) {
    const { initial, override } = this.snapshots[command.name]
    command._aliases = override.aliases = mapValues(aliases, (value) => value || null)

    if (write) {
      this.config[command.name] ||= {}
      this.config[command.name].name = `${command.parent?.name || ''}/${command.displayName}`
      this.config[command.name].aliases = filterKeys(aliases, (key, value) => {
        return !deepEqual(initial.aliases[key], value || null)
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

  create(name: string) {
    this.ctx.command(name)
    this.ensure(name, true)
    this.config[name] = { create: true }
    this.write()
  }

  remove(name: string) {
    const snapshot = this.snapshots[name]
    const commands = snapshot.command.children.slice()
    delete this.snapshots[name]
    delete this.config[name]
    for (const child of commands) {
      const { parent } = this.snapshots[child.name]
      this._teleport(child, parent)
      this.config[child.name].name = `${parent?.name || ''}/${child.displayName}`
    }
    snapshot.command.dispose()
    this.write(...commands)
  }

  accept(target: Command, override: Override, patch?: boolean) {
    const { create, options = {}, config = {} } = override

    // create snapshot for restoration
    this.ensure(target.name, create, patch)

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
    this.alias(target, {
      ...name ? { [name]: {} } : {},
      ...target._aliases,
      ...override.aliases,
    })
  }

  write(...commands: Command[]) {
    for (const command of commands) {
      const snapshot = this.ensure(command.name)
      const override = this.config[command.name]
      if (override.config && !Object.keys(override.config).length) {
        delete override.config
      }
      for (const key in override.options) {
        if (override.options[key] && !Object.keys(override.options[key]).length) {
          delete override.options[key]
        }
      }
      if (override.options && !Object.keys(override.options).length) {
        delete override.options
      }
      if (override.aliases && !Object.keys(override.aliases).length) {
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
    }
    this.ctx.scope.update(this.config, false)
  }
}

export default CommandManager
