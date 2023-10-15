import { Context } from 'koishi'
import CommandManager from '.'

export default function (ctx: Context, manager: CommandManager) {
  ctx.command('command <name>', '修改指令配置', { authority: 4 })
    // .option('option', '-o [key]  修改指令选项')
    // .option('create', '-c  创建指令')
    // .option('force', '-f  当指令不存在时延迟修改')
    .option('alias', '-a [name]  添加指令别名')
    .option('unalias', '-A [name]  移除指令别名')
    .option('name', '-n [name]  修改指令显示名')
    .option('parent', '-p [name]  修改指令父级')
    .option('parent', '-P  移除指令父级', { value: '' })
    .action(async ({ options }, name) => {
      const snapshot = manager.ensure(name)
      const command = snapshot.command
      if (options.alias) {
        const item = command._aliases[options.name] || {}
        const aliases = { ...command._aliases, [options.alias]: item }
        manager.alias(command, aliases, true)
      }
      if (options.unalias) {
        const aliases = { ...command._aliases }
        delete aliases[options.unalias]
        manager.alias(command, aliases, true)
      }
      if (options.name) {
        const item = command._aliases[options.name] || {}
        const aliases = { [options.name]: item, ...command._aliases }
        manager.alias(command, aliases, true)
      }
      if (typeof options.parent === 'string') {
        manager.teleport(command, options.parent, true)
      }
      return '已修改指令配置。'
    })
}
