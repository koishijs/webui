import { Context, makeArray, noop, Schema, Time, WebSocketLayer } from 'koishi'
import { Console, Entry } from '@koishijs/console'
import { ViteDevServer } from 'vite'
import { extname, resolve } from 'path'
import { createReadStream, existsSync, promises as fsp, Stats } from 'fs'
import open from 'open'

declare module 'koishi' {
  interface EnvData {
    clientCount?: number
  }
}

export * from '@koishijs/console'

interface ClientConfig {
  devMode: boolean
  uiPath: string
  endpoint: string
  static?: boolean
  heartbeat?: HeartbeatConfig
}

interface HeartbeatConfig {
  interval?: number
  timeout?: number
}

class NodeConsole extends Console {
  static inject = ['router']

  private vite: ViteDevServer
  public root: string
  public global = {} as ClientConfig
  readonly layer: WebSocketLayer

  constructor(public ctx: Context, public config: NodeConsole.Config) {
    super(ctx)

    const { devMode, uiPath, apiPath, selfUrl, heartbeat } = config
    this.global.devMode = devMode
    this.global.uiPath = uiPath
    this.global.heartbeat = heartbeat
    this.global.endpoint = selfUrl + apiPath

    this.layer = ctx.router.ws(config.apiPath, (socket, request) => {
      // @types/ws does not provide typings for `dispatchEvent`
      this.accept(socket as any, request)
    })

    ctx.on('console/connection', () => {
      if (!ctx.loader) return
      ctx.loader.envData.clientCount = this.layer.clients.size
    })

    this.root = config.root || (config.devMode
      ? resolve(require.resolve('@koishijs/client/package.json'), '../app')
      : resolve(__dirname, '../../dist'))
  }

  async start() {
    if (this.config.devMode) await this.createVite()
    this.serveAssets()

    this.ctx.on('router/ready', () => {
      const target = this.ctx.router.selfUrl + this.config.uiPath
      if (this.config.open && !this.ctx.loader?.envData.clientCount && !process.env.KOISHI_AGENT) {
        open(target)
      }
      this.logger.info('webui is available at %c', target)
    })
  }

  private getFiles(entry: string | string[] | Entry) {
    if (typeof entry === 'string' || Array.isArray(entry)) return entry
    if (!this.config.devMode) return entry.prod
    if (!existsSync(entry.dev)) return entry.prod
    return entry.dev
  }

  resolveEntry(entry: string | string[] | Entry, key: string) {
    const { devMode, uiPath } = this.config
    const filenames: string[] = []
    for (const local of makeArray(this.getFiles(entry))) {
      const filename = devMode ? '/vite/@fs/' + local : uiPath + '/' + key
      if (extname(local)) {
        filenames.push(filename)
      } else {
        filenames.push(filename + '/index.js')
        if (existsSync(local + '/style.css')) {
          filenames.push(filename + '/style.css')
        }
      }
    }
    return filenames
  }

  private serveAssets() {
    const { uiPath } = this.config

    this.ctx.router.get(uiPath + '(/.+)*', async (ctx, next) => {
      await next()
      if (ctx.body || ctx.response.body) return

      // add trailing slash and redirect
      if (ctx.path === uiPath && !uiPath.endsWith('/')) {
        return ctx.redirect(ctx.path + '/')
      }
      const name = ctx.path.slice(uiPath.length).replace(/^\/+/, '')
      const sendFile = (filename: string) => {
        ctx.type = extname(filename)
        return ctx.body = createReadStream(filename)
      }
      if (name.startsWith('extension-')) {
        const key = name.slice(0, 18)
        if (this.entries[key]) {
          const files = makeArray(this.getFiles(this.entries[key][0]))
          return sendFile(files[0] + name.slice(18))
        }
      }
      const filename = resolve(this.root, name)
      if (!filename.startsWith(this.root) && !filename.includes('node_modules')) {
        return ctx.status = 403
      }
      const stats = await fsp.stat(filename).catch<Stats>(noop)
      if (stats?.isFile()) return sendFile(filename)
      // const ext = extname(filename)
      // if (ext && ext !== '.html') return ctx.status = 404
      const template = await fsp.readFile(resolve(this.root, 'index.html'), 'utf8')
      ctx.type = 'html'
      ctx.body = await this.transformHtml(template)
    })
  }

  private async transformHtml(template: string) {
    const { uiPath } = this.config
    if (this.vite) {
      template = await this.vite.transformIndexHtml(uiPath, template)
    } else {
      template = template.replace(/(href|src)="(?=\/)/g, (_, $1) => `${$1}="${uiPath}`)
    }
    const headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify(this.global)}</script>`
    return template.replace('</title>', '</title>' + headInjection)
  }

  private async createVite() {
    const { cacheDir } = this.config
    const { createServer } = require('vite') as typeof import('vite')
    const { default: vue } = require('@vitejs/plugin-vue') as typeof import('@vitejs/plugin-vue')
    const { default: yaml } = require('@maikolib/vite-plugin-yaml') as typeof import('@maikolib/vite-plugin-yaml')

    this.vite = await createServer({
      root: this.root,
      base: '/vite/',
      cacheDir: resolve(this.ctx.baseDir, cacheDir),
      server: {
        middlewareMode: true,
        fs: {
          strict: false,
        },
      },
      plugins: [
        vue(),
        yaml(),
      ],
      resolve: {
        dedupe: ['vue', 'vue-demi', 'vue-router', 'element-plus', '@vueuse/core', '@popperjs/core', 'marked', 'xss'],
        alias: {
          '../client.js': '@koishijs/client',
          '../vue.js': 'vue',
          '../vue-router.js': 'vue-router',
          '../vueuse.js': '@vueuse/core',
        },
      },
      optimizeDeps: {
        include: [
          'vue',
          'vue-router',
          'element-plus',
          '@vueuse/core',
          '@popperjs/core',
          'marked',
          'xss',
        ],
      },
      build: {
        rollupOptions: {
          input: this.root + '/index.html',
        },
      },
    })

    this.ctx.router.all('/vite(/.+)*', (ctx) => new Promise((resolve) => {
      this.vite.middlewares(ctx.req, ctx.res, resolve)
    }))

    this.ctx.on('dispose', () => this.vite.close())
  }

  stop() {
    this.layer.close()
  }
}

namespace NodeConsole {
  export interface Config {
    root?: string
    uiPath?: string
    devMode?: boolean
    cacheDir?: string
    open?: boolean
    selfUrl?: string
    apiPath?: string
    heartbeat?: HeartbeatConfig
  }

  export const Config: Schema<Config> = Schema.object({
    root: Schema.string().hidden(),
    uiPath: Schema.string().default(''),
    apiPath: Schema.string().default('/status'),
    selfUrl: Schema.string().role('link').default(''),
    open: Schema.boolean(),
    heartbeat: Schema.object({
      interval: Schema.number().default(Time.second * 30),
      timeout: Schema.number().default(Time.minute),
    }),
    devMode: Schema.boolean().default(process.env.NODE_ENV === 'development').hidden(),
    cacheDir: Schema.string().default('cache/vite').hidden(),
  }).i18n({
    'zh-CN': require('./locales/zh-CN'),
  })
}

export default NodeConsole
