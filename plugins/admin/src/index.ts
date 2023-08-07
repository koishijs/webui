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
    group: UserGroup
  }
}

export interface UserGroup {
  id: number
  name: string
  permissions: string[]
  count?: number
  dispose?: () => void
}

export class Admin extends Service {
  data: UserGroup[]

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
  }

  async start() {
    this.data = await this.ctx.database.get('group', {})
    for (const item of this.data) {
      item.count = await this.ctx.database
        .select('user', { permissions: { $el: item.name } })
        .execute(row => $.count(row.id)) || 0
      item.dispose = this.ctx.permissions.define(`group.` + item.id, item.permissions)
    }
  }

  async createGroup(name?: string) {
    const item = await this.ctx.database.create('group', { name })
    item.count = 0
    item.dispose = this.ctx.permissions.define(`group.` + item.id, [])
    this.data.push(item)
    this.ctx.console?.groups?.refresh()
    return item.id
  }

  async renameGroup(id: number, name: string) {
    const item = this.data.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    item.name = name
    await this.ctx.database.set('group', id, { name })
    this.ctx.console?.groups?.refresh()
  }

  async deleteGroup(id: number) {
    const index = this.data.findIndex(group => group.id === id)
    if (index < 0) throw new Error('group not found')
    const item = this.data[index]!
    item.dispose!()
    for (const user of await this.ctx.database.get('user', { permissions: { $el: item.name } }, ['id', 'permissions'])) {
      remove(user.permissions, item.name)
      await this.ctx.database.set('user', user.id, { permissions: user.permissions })
    }
    this.data.splice(index, 1)
    await this.ctx.database.remove('group', id)
    this.ctx.console?.groups?.refresh()
  }

  async updateGroup(id: number, permissions: string[]) {
    const item = this.data.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    item.permissions = permissions
    item.dispose!()
    item.dispose = this.ctx.permissions.define(`group.` + item.id, permissions)
    await this.ctx.database.set('group', id, { permissions })
    this.ctx.console?.groups?.refresh()
  }

  async addUser(id: number, platform: string, aid: string) {
    const item = this.data.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    const data = await this.ctx.database.getUser(platform, aid, ['id', 'permissions'])
    if (!data) throw new Error('user not found')
    if (!data.permissions.includes(item.name)) {
      data.permissions.push(item.name)
      item.count!++
      await this.ctx.database.set('user', data.id, { permissions: data.permissions })
      this.ctx.console?.groups?.refresh()
    }
  }

  async removeUser(id: number, platform: string, aid: string) {
    const item = this.data.find(group => group.id === id)
    if (!item) throw new Error('group not found')
    const data = await this.ctx.database.getUser(platform, aid, ['id', 'permissions'])
    if (!data) throw new Error('user not found')
    if (remove(data.permissions, item.name)) {
      item.count!--
      await this.ctx.database.set('user', data.id, { permissions: data.permissions })
      this.ctx.console?.groups?.refresh()
    }
  }
}

export namespace Admin {
  export const using = ['database'] as const

  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Admin
