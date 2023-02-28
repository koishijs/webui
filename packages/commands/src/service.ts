import { DataService } from '@koishijs/plugin-console'
import { debounce } from 'throttle-debounce'
import { Argv, Command, Context, EffectScope } from 'koishi'
import { resolve } from 'path'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      commands: CommandProvider
    }
  }
}

export interface CommandData extends Command.Config {
  name: string
  paths: string[]
  aliases: string[]
  children: CommandData[]
  options: Argv.OptionDeclarationMap
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

function traverse(command: Command): CommandData {
  return {
    paths: findAncestors(command.ctx.scope),
    name: command.name,
    aliases: command._aliases,
    children: command.children.map(traverse),
    options: command._options,
    ...command.config,
  }
}

export default class CommandProvider extends DataService<CommandData[]> {
  static using = ['console'] as const

  cached: CommandData[]
  update = debounce(0, () => this.refresh())

  constructor(ctx: Context) {
    super(ctx, 'commands', { authority: 4 })

    ctx.on('command-added', this.update)
    ctx.on('command-removed', this.update)
    ctx.on('dispose', this.update.cancel)

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  }

  async get(forced = false) {
    if (this.cached && !forced) return this.cached
    this.cached = this.ctx.$commander._commandList.filter(cmd => !cmd.parent).map(traverse)
    return this.cached
  }
}
