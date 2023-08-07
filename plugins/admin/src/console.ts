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
    'admin/create-group'(name?: string): Promise<number>
    'admin/rename-group'(id: number, name: string): Promise<void>
    'admin/delete-group'(id: number): Promise<void>
    'admin/update-group'(id: number, permissions: string[]): Promise<void>
    'admin/add-user'(gid: number, platform: string, aid: string): Promise<void>
    'admin/remove-user'(gid: number, platform: string, aid: string): Promise<void>
  }
}

export default class UserGroupService extends DataService<Dict<UserGroup>> {
  static using = ['admin', 'console']

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

    ctx.console.addListener('admin/delete-group', (id) => {
      return ctx.admin.deleteGroup(id)
    })

    ctx.console.addListener('admin/update-group', (id, permissions) => {
      return ctx.admin.updateGroup(id, permissions)
    })

    ctx.console.addListener('admin/add-user', (gid, platform, aid) => {
      return ctx.admin.addUser(gid, platform, aid)
    })

    ctx.console.addListener('admin/remove-user', (gid, platform, aid) => {
      return ctx.admin.removeUser(gid, platform, aid)
    })
  }

  async get() {
    return Object.fromEntries(this.ctx.admin.data.map(group => [group.id, group]))
  }
}
