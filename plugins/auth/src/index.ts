import { Binding, Context, Logger, omit, Schema, Service, Time, User } from 'koishi'
import { Client } from '@koishijs/console'
import { createHash } from 'crypto'
import { resolve } from 'path'

declare module 'koishi' {
  interface Context {
    auth: AuthService
  }

  interface User {
    password: string
    config: any
  }

  interface Tables {
    token: LoginToken
  }
}

declare module '@koishijs/console' {
  interface Client {
    auth?: Auth
  }

  namespace Console {
    interface Services {
      user: DataService<AuthData>
    }
  }

  interface Events {
    'login/platform'(this: Client, platform: string, pid: string): Promise<UserLogin>
    'login/password'(this: Client, name: string, password: string): void
    'login/token'(this: Client, id: number, token: string): void
    'user/delete-token'(this: Client, inc: number): void
    'user/unbind'(this: Client, platform: string, pid: string): void
    'user/update'(this: Client, data: UserUpdate): void
    'user/logout'(this: Client): void
  }
}

export interface LoginToken {
  inc: number
  id: number
  type: LoginType
  token: string
  expiredAt: number
  createdAt: Date
  lastUsedAt: Date
  userAgent: string
  address: string
}

export type Auth =
  & Pick<LoginToken, 'token' | 'expiredAt'>
  & Pick<User, 'id' | 'name' | 'authority' | 'config'>

interface AuthData extends Auth {
  tokens: Omit<LoginToken, 'token' | 'id'>[]
  bindings: Omit<Binding, 'aid'>[]
}

type LoginType = 'platform' | 'password' | 'token'

const logger = new Logger('auth')

const letters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function randomId(length = 40) {
  return Array(length).fill(0).map(() => letters[Math.floor(Math.random() * letters.length)]).join('')
}

export interface UserLogin extends Pick<User, 'id' | 'name'> {
  token: string
  expiredAt: number
}

export type UserUpdate = Partial<Pick<User, 'name' | 'password' | 'config'>>

function toHash(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

class AuthService extends Service {
  static using = ['console', 'database'] as const

  constructor(ctx: Context, private config: AuthService.Config) {
    super(ctx, 'auth')

    ctx.model.extend('user', {
      password: 'string(255)',
      config: {
        type: 'json',
        length: 65535,
        initial: null,
      },
    })

    ctx.model.extend('token', {
      inc: 'unsigned',
      id: 'unsigned',
      type: 'string(255)',
      token: 'string(255)',
      expiredAt: 'unsigned(20)',
      createdAt: 'timestamp',
      lastUsedAt: 'timestamp',
      userAgent: 'string(255)',
      address: 'string(255)',
    }, {
      primary: 'inc',
      autoInc: true,
      unique: ['token'],
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
    logger.info('creating admin account')
    await this.ctx.database.upsert('user', [{
      id: 0,
      name: username,
      authority: 5,
      password: toHash(password),
      createdAt: new Date(),
    }])
  }

  async setAuth(client: Client, auth = client.auth, passive = false) {
    client.auth = auth
    if (passive) return
    if (auth) {
      const bindings = await this.ctx.database.get('binding', { aid: auth.id })
      bindings.forEach(binding => delete binding.aid)
      const tokens = await this.ctx.database.get('token', { id: auth.id })
      tokens.reverse().forEach(login => (delete login.id, delete login.token))
      client.send({ type: 'data', body: { key: 'user', value: { ...auth, bindings, tokens } } })
    } else {
      client.send({ type: 'data', body: { key: 'user', value: null } })
    }
    client.ctx.emit('console/connection', client)
    client.refresh()
  }

  async createToken(client: Client, type: LoginType, user: Pick<User, 'id' | 'name' | 'authority' | 'config'>) {
    const { headers, socket } = client.request
    const createdAt = new Date()
    const lastUsedAt = new Date()
    const userAgent = headers['user-agent']?.toString()
    const address = headers['x-forwarded-for']?.toString() || socket.remoteAddress
    const expiredAt = Date.now() + this.config.authTokenExpire
    const token = randomId()
    await this.ctx.database.create('token', { id: user.id, type, expiredAt, token, createdAt, lastUsedAt, userAgent, address })
    await this.setAuth(client, { ...user, expiredAt, token })
  }

  initLogin() {
    const self = this
    const { ctx, config } = this
    const states: Record<string, [string, number, Client]> = {}

    ctx.console.addListener('login/password', async function (name, password) {
      password = toHash(password)
      const [user] = await ctx.database.get('user', { name }, ['password', 'name', 'id', 'authority', 'config'])
      if (!user || user.password !== password) throw new Error('用户名或密码错误。')
      await self.createToken(this, 'password', omit(user, ['password']))
    })

    ctx.console.addListener('login/token', async function (aid, token) {
      const [data] = await ctx.database.get('token', { id: aid, token }, ['expiredAt'])
      if (!data || data.expiredAt <= Date.now()) throw new Error('令牌已失效。')
      const [user] = await ctx.database.get('user', { id: aid }, ['id', 'name', 'authority', 'config'])
      if (!user) throw new Error('用户不存在。')
      await ctx.database.set('token', { token }, { lastUsedAt: new Date() })
      await self.setAuth(this, { ...user, ...data, token })
    })

    ctx.console.addListener('login/platform', async function (platform, userId) {
      const user = await ctx.database.getUser(platform, userId, ['id', 'name'])
      if (!user) throw new Error('找不到此账户。')
      if (this.auth?.id === user.id) throw new Error('你已经绑定了此账户。')

      const key = `${platform}:${userId}`
      const token = Math.random().toString().slice(2, 8)
      const expiredAt = Date.now() + config.loginTokenExpire
      states[key] = [token, expiredAt, this]

      const listener = () => {
        delete states[key]
        dispose()
        this.socket.removeEventListener('close', dispose)
      }
      const dispose = ctx.setTimeout(() => {
        if (states[key]?.[1] >= Date.now()) listener()
      }, config.loginTokenExpire)
      this.socket.addEventListener('close', listener)

      return { id: user.id, name: user.name, token, expiredAt }
    })

    ctx.middleware(async (session, next) => {
      const state = states[session.uid]
      if (!state || state[0] !== session.stripped.content) {
        return next()
      }

      const { platform, userId: pid } = session
      if (state[2].auth) {
        await ctx.database.set('binding', { platform, pid }, { aid: state[2].auth.id })
        return self.setAuth(state[2], state[2].auth)
      } else {
        const user = await session.observeUser(['id', 'name', 'authority', 'config'])
        return self.createToken(state[2], 'platform', user)
      }
    }, true)

    ctx.on('console/intercept', async (client, listener) => {
      if (!listener.authority) return false
      if (!client.auth) return true
      if (client.auth.expiredAt <= Date.now()) return true
      if (client.auth.authority < listener.authority) return true
    })

    ctx.console.addListener('user/delete-token', async function (inc) {
      if (!this.auth) throw new Error('请先登录。')
      const [data] = await ctx.database.get('token', { id: this.auth.id, inc })
      if (!data) throw new Error('令牌不存在。')
      await ctx.database.remove('token', { inc })
      await self.setAuth(this)
    })

    ctx.console.addListener('user/logout', async function () {
      if (this.auth) {
        await ctx.database.remove('token', { token: this.auth.token })
      }
      await self.setAuth(this, null)
    })

    ctx.console.addListener('user/update', async function (data) {
      if (!this.auth) throw new Error('请先登录。')
      if (data.password) data.password = toHash(data.password)
      await ctx.database.set('user', { id: this.auth.id }, data)
      Object.assign(this.auth, data)
      await self.setAuth(this, undefined, true)
    })

    ctx.console.addListener('user/unbind', async function (platform, pid) {
      if (!this.auth) throw new Error('请先登录。')
      const bindings = await ctx.database.get('binding', { aid: this.auth.id })
      const binding = bindings.find(item => item.platform === platform && item.pid === pid)
      if (binding.aid !== binding.bid) {
        await ctx.database.set('binding', { platform, pid }, { aid: binding.bid })
      } else if (bindings.filter(item => item.aid === item.bid).length === 1) {
        throw new Error('无法解除绑定。')
      } else {
        await ctx.database.remove('binding', { platform, pid })
      }
      await self.setAuth(this)
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
      enabled: Schema.boolean().default(true),
    }),
    Schema.union([
      Schema.object({
        enabled: Schema.const(true),
        username: Schema.string().default('admin'),
        password: Schema.string().role('secret').required(),
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
    }),
    Schema.object({
      authTokenExpire: Schema.natural().role('ms').default(Time.week).min(Time.hour),
      loginTokenExpire: Schema.natural().role('ms').default(Time.minute * 10).min(Time.minute),
    }),
  ]).i18n({
    'zh-CN': require('./locales/zh-CN'),
  })
}

export default AuthService
