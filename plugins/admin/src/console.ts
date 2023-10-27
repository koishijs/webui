import { Context, Dict } from 'koishi'
import { DataService } from '@koishijs/console'
import { PermGroup, PermTrack } from '.'
import { resolve } from 'path'

declare module '@koishijs/console' {
  namespace Console {
    interface Services {
      admin: AdminDataService
    }
  }

  interface Events {
    'admin/create-track'(name: string): Promise<number>
    'admin/rename-track'(id: number, name: string): Promise<void>
    'admin/delete-track'(id: number): Promise<void>
    'admin/update-track'(id: number, permissions: string[]): Promise<void>
    'admin/create-group'(name: string): Promise<number>
    'admin/rename-group'(id: number, name: string): Promise<void>
    'admin/delete-group'(id: number): Promise<void>
    'admin/update-group'(id: number, permissions: string[]): Promise<void>
    'admin/add-user'(gid: number, platform: string, aid: string): Promise<void>
    'admin/remove-user'(gid: number, platform: string, aid: string): Promise<void>
  }
}

class AdminDataService extends DataService<AdminDataService.Data> {
  static inject = ['admin', 'console']

  constructor(ctx: Context) {
    super(ctx, 'admin')

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

    ctx.console.addListener('admin/create-track', (name) => {
      return ctx.admin.createTrack(name)
    })

    ctx.console.addListener('admin/rename-track', (id, name) => {
      return ctx.admin.renameTrack(id, name)
    })

    ctx.console.addListener('admin/delete-track', (id) => {
      return ctx.admin.deleteTrack(id)
    })

    ctx.console.addListener('admin/update-track', (id, permissions) => {
      return ctx.admin.updateTrack(id, permissions)
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
    return {
      group: Object.fromEntries(this.ctx.admin.groups.map(group => [group.id, group])),
      track: Object.fromEntries(this.ctx.admin.tracks.map(track => [track.id, track])),
    }
  }
}

namespace AdminDataService {
  export interface Data {
    group: Dict<PermGroup>
    track: Dict<PermTrack>
  }
}

export default AdminDataService
