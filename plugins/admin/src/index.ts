import { Context, Schema, Service } from 'koishi'
import * as command from './command'
import service from './console'
import zhCN from './locales/zh-CN.yml'

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
}

export function apply(ctx: Context) {
  ctx.i18n.define('zh-CN', zhCN)
  ctx.plugin(command)
}

export class Admin extends Service {
  data: UserGroup[]

  constructor(ctx: Context, public config: Admin.Config) {
    super(ctx, 'admin')

    ctx.model.extend('group', {
      id: 'unsigned',
      name: 'string',
      permissions: 'list',
    }, { autoInc: true })

    ctx.plugin(service)
  }

  async start() {
    this.data = await this.ctx.database.get('group', {})
    for (const { id, permissions } of this.data) {
      for (const name of permissions) {
        this.ctx.permissions.inherit(`group.` + id, name)
      }
    }
  }

  async createGroup(name?: string) {
    const item = await this.ctx.database.create('group', { name })
    this.data.push(item)
    this.ctx.console?.groups?.refresh()
    return item.id
  }

  async renameGroup(id: number, name: string) {
    const item = this.data.find(group => group.id === id)
    if (!item) return
    item.name = name
    await this.ctx.database.set('group', id, { name })
    this.ctx.console?.groups?.refresh()
  }

  async deleteGroup(id: number) {
    const index = this.data.findIndex(group => group.id === id)
    if (index < 0) return
    this.data.splice(index, 1)
    await this.ctx.database.remove('group', id)
    this.ctx.console?.groups?.refresh()
  }

  async updateGroup(id: number, permissions: string[]) {
    const item = this.data.find(group => group.id === id)
    if (!item) return
    item.permissions = permissions
    await this.ctx.database.set('group', id, { permissions })
    this.ctx.console?.groups?.refresh()
  }
}

export namespace Admin {
  export const using = ['database'] as const

  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Admin
