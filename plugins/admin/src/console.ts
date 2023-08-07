import { Context, Dict } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { UserGroup } from '.'
import { resolve } from 'path'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      groups: UserGroupService
    }
  }
}

export default class UserGroupService extends DataService<Dict<UserGroup>> {
  static using = ['admin']

  constructor(ctx: Context) {
    super(ctx, 'groups')

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
  }

  async get() {
    return Object.fromEntries(this.ctx.admin.data.map(group => [group.id, group]))
  }
}
