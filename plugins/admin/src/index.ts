import { $, Context, remove, Schema, Service } from 'koishi'
import command from './command'
import service from './console'
import zhCN from './locales/zh-CN.yml'

export * from './command'
export * from './console'

declare module 'koishi' {
  interface Context {
    admin: Admin
  }

  interface Tables {
    group: PermGroup
    perm_track: PermTrack
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

  constructor(ctx: Context, public config: Admin.Config) {
    super(ctx, 'admin')

    ctx.i18n.define('zh-CN', zhCN)
    ctx.plugin(command)
    ctx.plugin(service)

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
        .select('user', { permissions: { $el: 'group.' + item.id } })
        .execute(row => $.count(row.id)) || 0
      item.dispose = this.ctx.permissions.define('group.' + item.id, item.permissions)
    }
    for (const item of this.tracks) {
      item.dispose = this.track(item.permissions)
    }
  }

  private track(permissions: string[]) {
    const disposables = permissions.slice(1).map((_, index) => {
      return this.ctx.permissions.inherit(permissions[index + 1], permissions[index])
    })
    return () => disposables.forEach(fn => fn())
  }

  async createTrack(name: string) {
    const item = await this.ctx.database.create('perm_track', { name })
    item.dispose = this.track(item.permissions)
    this.tracks.push(item)
    this.ctx.get('console')?.refresh('admin')
    return item.id
  }

  async renameTrack(id: number, name: string) {
    const item = this.tracks.find(track => track.id === id)
    if (!item) throw new Error('track not found')
    if (item.name === name) return
    item.name = name
    await this.ctx.database.set('perm_track', id, { name })
    this.ctx.get('console')?.refresh('admin')
  }

  async deleteTrack(id: number) {
    const index = this.tracks.findIndex(track => track.id === id)
    if (index < 0) throw new Error('track not found')
    this.tracks.splice(index, 1)
    this.ctx.get('console')?.refresh('admin')
    await this.ctx.database.remove('perm_track', id)
  }

  async updateTrack(id: number, permissions: string[]) {
    const item = this.tracks.find(group => group.id === id)
    if (!item) throw new Error('track not found')
    item.permissions = permissions
    item.dispose!()
    item.dispose = this.track(permissions)
    await this.ctx.database.set('perm_track', id, { permissions })
    this.ctx.get('console')?.refresh('admin')
  }

  async createGroup(name: string) {
    const item = await this.ctx.database.create('group', { name })
    item.count = 0
    item.dispose = this.ctx.permissions.define('group.' + item.id, [])
    this.groups.push(item)
    this.ctx.get('console')?.refresh('admin')
    return item.id
  }

  async renameGroup(id: number, name: string) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    if (item.name === name) return
    item.name = name
    await this.ctx.database.set('group', id, { name })
    this.ctx.get('console')?.refresh('admin')
  }

  async deleteGroup(id: number) {
    const index = this.groups.findIndex(group => group.id === id)
    if (index < 0) throw new Error('group not found')
    const item = this.groups[index]!
    item.dispose!()
    this.groups.splice(index, 1)
    const users = await this.ctx.database.get('user', { permissions: { $el: 'group.' + id } }, ['id', 'permissions'])
    for (const user of users) {
      remove(user.permissions, 'group.' + id)
    }
    await this.ctx.database.upsert('user', users)
    const updates = this.groups.filter((group) => {
      return remove(group.permissions, 'group.' + id)
    })
    await this.ctx.database.upsert('group', updates)
    await this.ctx.database.remove('group', id)
    this.ctx.get('console')?.refresh('admin')
  }

  async updateGroup(id: number, permissions: string[]) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    item.permissions = permissions
    item.dispose!()
    item.dispose = this.ctx.permissions.define('group.' + item.id, permissions)
    await this.ctx.database.set('group', id, { permissions })
    this.ctx.get('console')?.refresh('admin')
  }

  async addUser(id: number, platform: string, aid: string) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    const data = await this.ctx.database.getUser(platform, aid, ['id', 'permissions'])
    if (!data) throw new Error('user not found')
    if (!data.permissions.includes('group.' + item.id)) {
      data.permissions.push('group.' + item.id)
      item.count!++
      await this.ctx.database.set('user', data.id, { permissions: data.permissions })
      this.ctx.get('console')?.refresh('admin')
    }
  }

  async removeUser(id: number, platform: string, aid: string) {
    const item = this.groups.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    const data = await this.ctx.database.getUser(platform, aid, ['id', 'permissions'])
    if (!data) throw new Error('user not found')
    if (remove(data.permissions, 'group.' + item.id)) {
      item.count!--
      await this.ctx.database.set('user', data.id, { permissions: data.permissions })
      this.ctx.get('console')?.refresh('admin')
    }
  }
}

export namespace Admin {
  export const inject = ['database']

  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Admin
