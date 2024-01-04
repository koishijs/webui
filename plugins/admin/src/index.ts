import { $, Context, Dict, remove, Schema, Service } from 'koishi'
import { Entry } from '@koishijs/console'
import { resolve } from 'path'
import command from './command'
import zhCN from './locales/zh-CN.yml'

export * from './command'

declare module 'koishi' {
  interface Context {
    admin: Admin
  }

  interface Tables {
    group: PermGroup
    perm_track: PermTrack
  }
}

declare module '@koishijs/console' {
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

export interface PermGroup {
  id: number
  name: string
  permissions: string[]
  count?: number
  dispose?: () => void
}

export interface PermTrack {
  id: number
  name: string
  permissions: string[]
  dispose?: () => void
}

export class Admin extends Service {
  groups: PermGroup[]
  tracks: PermTrack[]
  entry?: Entry<Admin.Data>

  constructor(ctx: Context, public config: Admin.Config) {
    super(ctx, 'admin')

    ctx.i18n.define('zh-CN', zhCN)
    ctx.plugin(command)

    ctx.model.extend('group', {
      id: 'unsigned',
      name: 'string',
      permissions: 'list',
    }, { autoInc: true })

    ctx.model.extend('perm_track', {
      id: 'unsigned',
      name: 'string',
      permissions: 'list',
    }, { autoInc: true })
  }

  async start() {
    this.groups = await this.ctx.database.get('group', {})
    this.tracks = await this.ctx.database.get('perm_track', {})
    for (const item of this.groups) {
      item.count = await this.ctx.database
        .select('user', { permissions: { $el: 'group:' + item.id } })
        .execute(row => $.count(row.id)) || 0
      this.setupGroup(item)
    }
    for (const item of this.tracks) {
      this.setupTrack(item)
    }

    this.ctx.inject(['console'], (ctx) => {
      ctx.on('dispose', () => this.entry = undefined)

      this.entry = ctx.console.addEntry(process.env.KOISHI_BASE ? [
        process.env.KOISHI_BASE + '/dist/index.js',
        process.env.KOISHI_BASE + '/dist/style.css',
      ] : process.env.KOISHI_ENV === 'browser' ? [
        // @ts-ignore
        import.meta.url.replace(/\/src\/[^/]+$/, '/client/index.ts'),
      ] : {
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      }, () => ({
        group: Object.fromEntries(this.groups.map(group => [group.id, group])),
        track: Object.fromEntries(this.tracks.map(track => [track.id, track])),
      }))

      ctx.console.addListener('admin/create-track', (name) => {
        return this.createTrack(name)
      })

      ctx.console.addListener('admin/rename-track', (id, name) => {
        return this.renameTrack(id, name)
      })

      ctx.console.addListener('admin/delete-track', (id) => {
        return this.deleteTrack(id)
      })

      ctx.console.addListener('admin/update-track', (id, permissions) => {
        return this.updateTrack(id, permissions)
      })

      ctx.console.addListener('admin/create-group', (name) => {
        return this.createGroup(name)
      })

      ctx.console.addListener('admin/rename-group', (id, name) => {
        return this.renameGroup(id, name)
      })

      ctx.console.addListener('admin/delete-group', (id) => {
        return this.deleteGroup(id)
      })

      ctx.console.addListener('admin/update-group', (id, permissions) => {
        return this.updateGroup(id, permissions)
      })

      ctx.console.addListener('admin/add-user', (gid, platform, aid) => {
        return this.addUser(gid, platform, aid)
      })

      ctx.console.addListener('admin/remove-user', (gid, platform, aid) => {
        return this.removeUser(gid, platform, aid)
      })
    })
  }

  private setupGroup(item: PermGroup) {
    item.dispose = this.ctx.permissions.define('(name)', {
      inherits: ({ name }) => item.permissions.includes(name) && ['group:' + item.id],
    })
  }

  private setupTrack(item: PermTrack) {
    item.dispose = this.ctx.permissions.define('(name)', {
      inherits: ({ name }) => {
        const index = item.permissions.indexOf(name)
        if (index > 0) return [item.permissions[index - 1]]
      },
    })
  }

  async createTrack(name: string) {
    const item = await this.ctx.database.create('perm_track', { name })
    this.setupTrack(item)
    this.tracks.push(item)
    this.entry?.refresh()
    return item.id
  }

  async renameTrack(id: number, name: string) {
    const item = this.tracks.find(track => track.id === id)
    if (!item) throw new Error('track not found')
    if (item.name === name) return
    item.name = name
    await this.ctx.database.set('perm_track', id, { name })
    this.entry?.refresh()
  }

  async deleteTrack(id: number) {
    const index = this.tracks.findIndex(track => track.id === id)
    if (index < 0) throw new Error('track not found')
    const [item] = this.tracks.splice(index, 1)
    item.dispose!()
    this.entry?.refresh()
    await this.ctx.database.remove('perm_track', id)
  }

  async updateTrack(id: number, permissions: string[]) {
    const item = this.tracks.find(group => group.id === id)
    if (!item) throw new Error('track not found')
    item.permissions = permissions
    await this.ctx.database.set('perm_track', id, { permissions })
    this.entry?.refresh()
  }

  async createGroup(name: string) {
    const item = await this.ctx.database.create('group', { name })
    item.count = 0
    this.setupGroup(item)
    this.groups.push(item)
    this.entry?.refresh()
    return item.id
  }

  async renameGroup(id: number, name: string) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    if (item.name === name) return
    item.name = name
    await this.ctx.database.set('group', id, { name })
    this.entry?.refresh()
  }

  async deleteGroup(id: number) {
    const index = this.groups.findIndex(group => group.id === id)
    if (index < 0) throw new Error('group not found')
    const [item] = this.groups.splice(index, 1)
    item.dispose!()
    const users = await this.ctx.database.get('user', { permissions: { $el: 'group:' + id } }, ['id', 'permissions'])
    for (const user of users) {
      remove(user.permissions, 'group:' + id)
    }
    await this.ctx.database.upsert('user', users)
    const updates = this.groups.filter((group) => {
      return remove(group.permissions, 'group:' + id)
    })
    await this.ctx.database.upsert('group', updates)
    await this.ctx.database.remove('group', id)
    this.entry?.refresh()
  }

  async updateGroup(id: number, permissions: string[]) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    item.permissions = permissions
    await this.ctx.database.set('group', id, { permissions })
    this.entry?.refresh()
  }

  async addUser(id: number, platform: string, aid: string) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    const data = await this.ctx.database.getUser(platform, aid, ['id', 'permissions'])
    if (!data) throw new Error('user not found')
    if (!data.permissions.includes('group:' + item.id)) {
      data.permissions.push('group:' + item.id)
      item.count!++
      await this.ctx.database.set('user', data.id, { permissions: data.permissions })
      this.entry?.refresh()
    }
  }

  async removeUser(id: number, platform: string, aid: string) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    const data = await this.ctx.database.getUser(platform, aid, ['id', 'permissions'])
    if (!data) throw new Error('user not found')
    if (remove(data.permissions, 'group:' + item.id)) {
      item.count!--
      await this.ctx.database.set('user', data.id, { permissions: data.permissions })
      this.entry?.refresh()
    }
  }
}

export namespace Admin {
  export const inject = ['database']

  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})

  export interface Data {
    group: Dict<PermGroup>
    track: Dict<PermTrack>
  }
}

export default Admin
