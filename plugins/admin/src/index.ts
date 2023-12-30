import { $, Context, remove, Schema, Service } from 'koishi'
import command from './command'
import console from './console'
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
    ctx.plugin(console)

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
      this.setupGroup(item)
    }
    for (const item of this.tracks) {
      this.setupTrack(item)
    }
  }

  private setupGroup(item: PermGroup) {
    item.dispose = this.ctx.permissions.define('(name)', {
      inherits: ({ name }) => item.permissions.includes(name) && ['group.' + item.id],
      list: () => ['group.' + item.id],
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
    const [item] = this.tracks.splice(index, 1)
    item.dispose!()
    this.ctx.get('console')?.refresh('admin')
    await this.ctx.database.remove('perm_track', id)
  }

  async updateTrack(id: number, permissions: string[]) {
    const item = this.tracks.find(group => group.id === id)
    if (!item) throw new Error('track not found')
    item.permissions = permissions
    await this.ctx.database.set('perm_track', id, { permissions })
    this.ctx.get('console')?.refresh('admin')
  }

  async createGroup(name: string) {
    const item = await this.ctx.database.create('group', { name })
    item.count = 0
    this.setupGroup(item)
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
    const [item] = this.groups.splice(index, 1)
    item.dispose!()
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
