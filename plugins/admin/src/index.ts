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
}

export namespace Admin {
  export const using = ['database'] as const

  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Admin
