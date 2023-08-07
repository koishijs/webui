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

  interface Events {
    'admin/create-group'(name: string): Promise<number>
    'admin/rename-group'(id: number, name: string): Promise<void>
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

    ctx.console.addListener('admin/create-group', (name) => {
      return ctx.admin.createGroup(name)
    })

    ctx.console.addListener('admin/rename-group', (id, name) => {
      return ctx.admin.renameGroup(id, name)
    })
  }

  async get() {
    return Object.fromEntries(this.ctx.admin.data.map(group => [group.id, group]))
  }
}
