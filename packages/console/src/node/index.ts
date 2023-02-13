import { Context, noop, Schema, WebSocketLayer } from 'koishi'
import { Console, Entry } from '../shared'
import { ViteDevServer } from 'vite'
import { extname, resolve } from 'path'
import { createReadStream, existsSync, promises as fsp, Stats } from 'fs'
import open from 'open'

declare module 'koishi' {
  interface EnvData {
    clientCount?: number
  }
}

export * from '../shared'

interface ClientConfig {
  devMode: boolean
  uiPath: string
  endpoint: string
  static?: boolean
}

class NodeConsole extends Console {
  private vite: ViteDevServer
  public root: string
  public global = {} as ClientConfig
  readonly layer: WebSocketLayer

  constructor(public ctx: Context, public config: NodeConsole.Config) {
    super(ctx)

    const { devMode, uiPath, apiPath, selfUrl } = config
    this.global.devMode = devMode
    this.global.uiPath = uiPath
    this.global.endpoint = selfUrl + apiPath

    this.layer = ctx.router.ws(config.apiPath, (socket) => {
      // @types/ws does not provide typings for `dispatchEvent`
      this.accept(socket as any)
    })

    ctx.on('console/connection', () => {
      ctx.envData.clientCount = this.layer.clients.size
    })

    this.root = config.root || config.devMode
      ? resolve(require.resolve('@koishijs/client/package.json'), '../app')
      : resolve(__dirname, '../../dist')
  }

  async start() {
    if (this.config.devMode) await this.createVite()
    this.serveAssets()

    if (this.config.open && !this.ctx.envData.clientCount && !process.env.KOISHI_AGENT) {
      open(this.ctx.router.selfUrl + this.config.uiPath)
    }
  }

  resolveEntry(entry: string | string[] | Entry) {
    if (typeof entry === 'string' || Array.isArray(entry)) return entry
    if (!this.config.devMode) return entry.prod
    if (!existsSync(entry.dev)) return entry.prod
    return entry.dev
  }

  async get() {
    const { devMode, uiPath } = this.config
    const filenames: string[] = []
    for (const key in this.entries) {
      for (const local of this.entries[key]) {
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
        // FIXME
        if (this.entries[key]) return sendFile(this.entries[key][0] + name.slice(18))
      }
      const filename = resolve(this.root, name)
      if (!filename.startsWith(this.root) && !filename.includes('node_modules')) {
        return ctx.status = 403
      }
      const stats = await fsp.stat(filename).catch<Stats>(noop)
      if (stats?.isFile()) return sendFile(filename)
      const ext = extname(filename)
      if (ext && ext !== '.html') return ctx.status = 404
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
    const headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify(this.ctx.console.global)}</script>`
    return template.replace('</title>', '</title>' + headInjection)
  }

  private async createVite() {
    const { cacheDir } = this.config
    const { createServer } = require('vite') as typeof import('vite')
    const { default: vue } = require('@vitejs/plugin-vue') as typeof import('@vitejs/plugin-vue')

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
      plugins: [vue()],
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
  }

  export const Config: Schema<Config> = Schema.object({
    root: Schema.string().description('前端页面的根目录。').hidden(),
    uiPath: Schema.string().description('前端页面呈现的路径。').default(''),
    apiPath: Schema.string().description('后端 API 服务的路径。').default('/status'),
    selfUrl: Schema.string().description('Koishi 服务暴露在公网的地址。').role('link').default(''),
    open: Schema.boolean().description('在应用启动后自动在浏览器中打开控制台。'),
    devMode: Schema.boolean().description('启用调试模式 (仅供开发者使用)。').default(process.env.NODE_ENV === 'development').hidden(),
    cacheDir: Schema.string().description('调试服务器缓存目录。').default('.vite').hidden(),
  })
}

export default NodeConsole
