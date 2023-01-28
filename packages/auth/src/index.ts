import { $, Awaitable, Context, isNullable, omit, pick, Schema, Time, User } from 'koishi'
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
    'login/platform'(this: Client, platform: string, userId: string, id?: number): Awaitable<UserLogin>
    'login/password'(this: Client, name: string, password: string): void
    'login/token'(this: Client, id: number, token: string): void
    'user/update'(this: Client, data: UserUpdate): void
    'user/logout'(this: Client): void
  }
}

export type UserAuth = Pick<User, AuthFields>
export type UserLogin = Pick<User, 'id' | 'name' | 'token' | 'expire'>
export type UserUpdate = Partial<Pick<User, 'name' | 'password'>>

type AuthFields = typeof authFields[number]
const authFields = ['name', 'authority', 'id', 'expire', 'token'] as const

function setAuthUser(client: Client, value: UserAuth, platforms: Set<any>) {
  if (value) {
    value = {
      ...omit(value, ['password', ...platforms]),
      accounts: Object.entries(pick(value, platforms))
        .filter(([, value]) => value)
        .map(([platform, id]) => ({ platform, id })),
    } as any
  }
  client.user = value
  client.send({ type: 'data', body: { key: 'user', value } })
  client.refresh()
}

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
    // check if there is an authoized user
    const count = await this.ctx.database.select('user', {
      authority: { $gte: 4 },
    }).execute(_ => $.count(_.id))
    if (count) return
    const password = toHash('123456')
    await this.ctx.database.create('user', { id: 0, name: 'admin', authority: 5, password })
  }

  initLogin() {
    const { ctx, config } = this
    const states: Record<string, [string, number, Client, number]> = {}

    let platforms: Set<never> = getPlatforms()
    function getPlatforms() {
      return new Set(ctx.bots.filter(bot => !bot.hidden).map(bot => bot.platform as never))
    }

    ctx.on('bot-added', () => {
      platforms = getPlatforms()
    })

    ctx.on('bot-removed', () => {
      platforms = getPlatforms()
    })

    ctx.console.addListener('login/password', async function (name, password) {
      password = toHash(password)
      const user = await ctx.database.getUser('name', name, ['password', ...platforms, ...authFields])
      if (!user || user.password !== password) throw new Error('用户名或密码错误。')
      if (!user.expire || user.expire < Date.now()) {
        user.token = v4()
        user.expire = Date.now() + config.authTokenExpire
        await ctx.database.setUser('name', name, pick(user, ['token', 'expire']))
      }
      setAuthUser(this, user, platforms)
    })

    ctx.console.addListener('login/token', async function (id, token) {
      const [user] = await ctx.database.get('user', { id }, ['name', ...platforms, ...authFields])
      if (!user) throw new Error('用户不存在。')
      if (user.token !== token || user.expire <= Date.now()) throw new Error('令牌已失效。')
      setAuthUser(this, user, platforms)
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

      if (!isNullable(state[3])) {
        const old = await session.observeUser()
        await ctx.database.remove('user', { [session.platform]: session.userId })
        await ctx.database.set('user', { id: state[3] }, {
          [session.platform]: session.userId,
          ...omit(old, ['id', 'name', ...authFields, ...platforms] as any),
        })
        const [user] = await ctx.database.get('user', { id: state[3] }, ['name', ...platforms, ...authFields])
        return setAuthUser(state[2], user, platforms)
      }

      const user = await session.observeUser(['name', ...platforms, ...authFields])
      if (!user.expire || user.expire < Date.now()) {
        user.token = v4()
        user.expire = Date.now() + config.authTokenExpire
        await user.$update()
      }
      return setAuthUser(state[2], user, platforms)
    }, true)

    ctx.on('console/intercept', (client, listener) => {
      if (!listener.authority) return false
      if (!client.user) return true
      if (client.user.expire <= Date.now()) return true
      return client.user.authority < listener.authority
    })

    ctx.console.addListener('user/logout', async function () {
      setAuthUser(this, null, platforms)
    })

    ctx.console.addListener('user/update', async function (data) {
      if (!this.user) throw new Error('请先登录。')
      if (data.password) data.password = toHash(data.password)
      await ctx.database.set('user', { id: this.user.id }, data)
      Object.assign(this.user, data)
      setAuthUser(this, this.user, platforms)
    })
  }
}

namespace AuthService {
  export interface Config {
    authTokenExpire?: number
    loginTokenExpire?: number
  }

  export const Config: Schema<Config> = Schema.object({
    authTokenExpire: Schema.natural().role('ms').default(Time.week).description('用户令牌有效期。'),
    loginTokenExpire: Schema.natural().role('ms').default(Time.minute * 10).description('登录令牌有效期。'),
  })
}

export default AuthService
