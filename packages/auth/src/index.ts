import { Awaitable, Binding, Context, isNullable, omit, pick, Schema, Time, User } from 'koishi'
import { Client, DataService } from '@koishijs/plugin-console'
import { createHash } from 'crypto'
import { resolve } from 'path'
import { v4 } from 'uuid'

declare module 'koishi' {
  interface User {
    password: string
    token: string
    expire: number
  }
}

declare module '@koishijs/plugin-console' {
  interface Client {
    user?: UserAuth
  }

  namespace Console {
    interface Services {
      user: AuthService
    }
  }

  interface Events {
    'login/platform'(this: Client, platform: string, pid: string, aid?: number): Awaitable<UserLogin>
    'login/password'(this: Client, name: string, password: string): void
    'login/token'(this: Client, id: number, token: string): void
    'user/unbind'(this: Client, platform: string, pid: string): void
    'user/update'(this: Client, data: UserUpdate): void
    'user/logout'(this: Client): void
  }
}

export interface UserAuth extends Pick<User, AuthFields> {
  bindings?: Omit<Binding, 'aid'>[]
}

export type UserLogin = Pick<User, 'id' | 'name' | 'token' | 'expire'>
export type UserUpdate = Partial<Pick<User, 'name' | 'password'>>

type AuthFields = typeof authFields[number]
const authFields = ['name', 'authority', 'id', 'expire', 'token'] as const

function toHash(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

class AuthService extends DataService<UserAuth> {
  static using = ['console', 'database'] as const

  constructor(ctx: Context, private config: AuthService.Config) {
    super(ctx, 'user')

    ctx.model.extend('user', {
      password: 'string(255)',
      token: 'string(255)',
      expire: 'unsigned(20)',
    })

    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })

    this.initLogin()
  }

  async start() {
    const { enabled, username, password } = this.config.admin
    if (!enabled) return
    await this.ctx.database.create('user', {
      id: 0,
      name: username,
      authority: 5,
      password: toHash(password),
    })
  }

  async setAuthUser(client: Client, value: UserAuth) {
    if (value) {
      const bindings = await this.ctx.database.get('binding', { aid: value.id })
      value = {
        ...omit(value, ['password' as never]),
        bindings: bindings.map(binding => omit(binding, ['aid'])),
      }
    }
    client.user = value
    client.ctx.emit('console/connection', client)
    client.send({ type: 'data', body: { key: 'user', value } })
    client.refresh()
  }

  initLogin() {
    const self = this
    const { ctx, config } = this
    const states: Record<string, [string, number, Client, number]> = {}

    ctx.console.addListener('login/password', async function (name, password) {
      password = toHash(password)
      const [user] = await ctx.database.get('user', { name }, ['password', ...authFields])
      if (!user || user.password !== password) throw new Error('用户名或密码错误。')
      if (!user.expire || user.expire < Date.now()) {
        user.token = v4()
        user.expire = Date.now() + config.authTokenExpire
        await ctx.database.set('user', { name }, pick(user, ['token', 'expire']))
      }
      await self.setAuthUser(this, user)
    })

    ctx.console.addListener('login/token', async function (id, token) {
      const [user] = await ctx.database.get('user', { id }, [...authFields])
      if (!user) throw new Error('用户不存在。')
      if (user.token !== token || user.expire <= Date.now()) throw new Error('令牌已失效。')
      await self.setAuthUser(this, user)
    })

    ctx.console.addListener('login/platform', async function (platform, userId, id) {
      const user = await ctx.database.getUser(platform, userId, ['id', 'name'])
      if (!user) throw new Error('找不到此账户。')
      if (id === user.id) throw new Error('你已经绑定了此账户。')

      const key = `${platform}:${userId}`
      const token = v4()
      const expire = Date.now() + config.loginTokenExpire
      states[key] = [token, expire, this, id]

      const listener = () => {
        delete states[key]
        dispose()
        this.socket.removeEventListener('close', dispose)
      }
      const dispose = ctx.setTimeout(() => {
        if (states[key]?.[1] >= Date.now()) listener()
      }, config.loginTokenExpire)
      this.socket.addEventListener('close', listener)

      return { id: user.id, name: user.name, token, expire }
    })

    ctx.middleware(async (session, next) => {
      const state = states[session.uid]
      if (!state || state[0] !== session.content.trim()) {
        return next()
      }

      const aid = state[3]
      const { platform, userId: pid } = session
      if (!isNullable(aid)) {
        await ctx.database.set('binding', { platform, pid }, { aid })
        const [user] = await ctx.database.get('user', { id: state[3] }, [...authFields])
        return self.setAuthUser(state[2], user)
      }

      const user = await session.observeUser([...authFields])
      if (!user.expire || user.expire < Date.now()) {
        user.token = v4()
        user.expire = Date.now() + config.authTokenExpire
        await user.$update()
      }
      return self.setAuthUser(state[2], user)
    }, true)

    ctx.on('console/intercept', (client, listener) => {
      if (!listener.authority) return false
      if (!client.user) return true
      if (client.user.expire <= Date.now()) return true
      return client.user.authority < listener.authority
    })

    ctx.console.addListener('user/logout', async function () {
      await self.setAuthUser(this, null)
    })

    ctx.console.addListener('user/update', async function (data) {
      if (!this.user) throw new Error('请先登录。')
      if (data.password) data.password = toHash(data.password)
      await ctx.database.set('user', { id: this.user.id }, data)
      Object.assign(this.user, data)
      await self.setAuthUser(this, this.user)
    })

    ctx.console.addListener('user/unbind', async function (platform, pid) {
      if (!this.user) throw new Error('请先登录。')
      const bindings = await ctx.database.get('binding', { aid: this.user.id })
      const binding = bindings.find(item => item.platform === platform && item.pid === pid)
      if (binding.aid !== binding.bid) {
        await ctx.database.set('binding', { platform, pid }, { aid: binding.bid })
      } else if (bindings.filter(item => item.aid === item.bid).length === 1) {
        throw new Error('无法解除绑定。')
      } else {
        await ctx.database.remove('binding', { platform, pid })
      }
      await self.setAuthUser(this, this.user)
    })
  }
}

namespace AuthService {
  export const filter = false

  export interface Admin {
    enabled?: boolean
    username?: string
    password?: string
  }

  export const Admin: Schema<Admin> = Schema.intersect([
    Schema.object({
      enabled: Schema.boolean().default(true).description('启用管理员账号。'),
    }),
    Schema.union([
      Schema.object({
        enabled: Schema.const(true),
        username: Schema.string().default('admin').description('管理员用户名。'),
        password: Schema.string().role('secret').required().description('管理员密码。'),
      }),
      Schema.object({}),
    ]),
  ])

  export interface Config {
    admin?: Admin
    authTokenExpire?: number
    loginTokenExpire?: number
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      admin: Admin,
    }).description('管理员设置'),
    Schema.object({
      authTokenExpire: Schema.natural().role('ms').default(Time.week).description('用户令牌有效期。'),
      loginTokenExpire: Schema.natural().role('ms').default(Time.minute * 10).description('登录令牌有效期。'),
    }).description('高级设置'),
  ])
}

export default AuthService
