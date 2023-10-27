import { Context } from 'koishi'
import CommandManager from '.'
import zhCN from './locales/zh-CN.yml'

export function remove<O, K extends keyof O>(object: O, key: K) {
  const value = object[key]
  delete object[key]
  return value
}

export default function (ctx: Context, manager: CommandManager) {
  ctx.i18n.define('zh-CN', zhCN)

  ctx.command('command <name>', { authority: 4, checkArgCount: true })
    // .option('option', '-o [key]')
    .option('create', '-c')
    .option('alias', '-a [name]')
    .option('unalias', '-A [name]')
    .option('rename', '-n [name]')
    .option('parent', '-p [name]')
    .option('parent', '-P, --no-parent', { value: '' })
    .action(async ({ options, session }, name) => {
      if (options.create) manager.create(name)
      if (!ctx.$commander.resolve(name)) {
        return session.text('.not-found')
      }

      const snapshot = manager.ensure(name)
      const command = snapshot.command
      if (typeof options.alias === 'string') {
        const item = command._aliases[options.rename] || {}
        const aliases = { ...command._aliases, [options.alias]: item }
        manager.alias(command, aliases, true)
        delete options.alias
      }
      if (typeof options.unalias === 'string') {
        const aliases = { ...command._aliases }
        delete aliases[options.unalias]
        manager.alias(command, aliases, true)
        delete options.unalias
      }
      if (typeof options.rename === 'string') {
        const item = command._aliases[options.rename] || {}
        const aliases = { [options.rename]: item, ...command._aliases }
        manager.alias(command, aliases, true)
        delete options.rename
      }
      if (typeof options.parent === 'string') {
        manager.teleport(command, options.parent, true)
        delete options.parent
      }
      return options.create ? session.text('.created') : session.text('.updated')
    })
}
