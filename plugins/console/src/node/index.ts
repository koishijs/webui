import { Context, Dict, h, makeArray, noop, Schema, Time } from 'koishi'
import { WebSocketLayer } from '@koishijs/plugin-server'
import { Console, Entry } from '@koishijs/console'
import { FileSystemServeOptions, ViteDevServer } from 'vite'
import { extname, resolve } from 'path'
import { createReadStream, existsSync, promises as fsp, Stats } from 'fs'
import {} from '@koishijs/plugin-server-proxy'
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
  proxyBase?: string
}

interface HeartbeatConfig {
  interval?: number
  timeout?: number
}

class NodeConsole extends Console {
  static inject = ['server']

  // workaround for edge case (collision with @koishijs/plugin-config)
  private _config: NodeConsole.Config

  public vite: ViteDevServer
  public root: string
  public layer: WebSocketLayer

  constructor(public ctx: Context, config: NodeConsole.Config) {
    super(ctx)
    this.config = config

    this.layer = ctx.server.ws(config.apiPath, (socket, request) => {
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

  get config() {
    return this._config
  }

  set config(value) {
    this._config = value
  }

  createGlobal() {
    const global = {} as ClientConfig
    const { devMode, uiPath, apiPath, selfUrl, heartbeat } = this.config
    global.devMode = devMode
    global.uiPath = uiPath
    global.heartbeat = heartbeat
    global.endpoint = selfUrl + apiPath
    const proxy = this.ctx.get('server.proxy')
    if (proxy) global.proxyBase = proxy.config.path + '/'
    return global
  }

  async start() {
    if (this.config.devMode) await this.createVite()
    this.serveAssets()

    this.ctx.on('server/ready', () => {
      const target = this.ctx.server.selfUrl + this.config.uiPath
      if (this.config.open && !this.ctx.loader?.envData.clientCount && !process.env.KOISHI_AGENT) {
        open(target)
      }
      this.logger.info('webui is available at %c', target)
    })
  }

  private getFiles(files: Entry.Files) {
    if (typeof files === 'string' || Array.isArray(files)) return files
    if (!this.config.devMode) return files.prod
    if (!existsSync(files.dev)) return files.prod
    return files.dev
  }

  resolveEntry(files: Entry.Files, key: string) {
    const { devMode, uiPath } = this.config
    const filenames: string[] = []
    for (const local of makeArray(this.getFiles(files))) {
      const filename = devMode ? '/vite/@fs/' + local : uiPath + '/@plugin-' + key
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

    this.ctx.server.get(uiPath + '(/.+)*', async (ctx, next) => {
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
      if (name.startsWith('@plugin-')) {
        const [key] = name.slice(8).split('/', 1)
        if (this.entries[key]) {
          const files = makeArray(this.getFiles(this.entries[key].files))
          return sendFile(files[0] + name.slice(8 + key.length))
        } else {
          return ctx.status = 404
        }
      }
      const filename = resolve(this.root, name)
      if (!filename.startsWith(this.root) && !filename.includes('node_modules')) {
        return ctx.status = 403
      }
      const stats = await fsp.stat(filename).catch<Stats>(noop)
      if (stats?.isFile()) return sendFile(filename)
      const template = await fsp.readFile(resolve(this.root, 'index.html'), 'utf8')
      ctx.type = 'html'
      ctx.body = await this.transformHtml(template)
    })
  }

  private async transformHtml(template: string) {
    const { uiPath, head = [] } = this.config
    if (this.vite) {
      template = await this.vite.transformIndexHtml(uiPath, template)
    } else {
      template = template.replace(/(href|src)="(?=\/)/g, (_, $1) => `${$1}="${uiPath}`)
    }
    let headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify(this.createGlobal())}</script>`
    for (const { tag, attrs = {}, content } of head) {
      const attrString = Object.entries(attrs).map(([key, value]) => ` ${key}="${h.escape(value ?? '', true)}"`).join('')
      headInjection += `<${tag}${attrString}>${content ?? ''}</${tag}>`
    }
    return template.replace('</title>', '</title>' + headInjection)
  }

  private async createVite() {
    const { cacheDir, dev } = this.config
    const { createServer } = require('vite') as typeof import('vite')
    const { default: mini } = require('unocss/preset-mini') as typeof import('unocss/preset-mini')
    const { default: unocss } = require('unocss/vite') as typeof import('unocss/vite')
    const { default: vue } = require('@vitejs/plugin-vue') as typeof import('@vitejs/plugin-vue')
    const { default: yaml } = require('@maikolib/vite-plugin-yaml') as typeof import('@maikolib/vite-plugin-yaml')

    this.vite = await createServer({
      root: this.root,
      base: '/vite/',
      cacheDir: resolve(this.ctx.baseDir, cacheDir),
      server: {
        middlewareMode: true,
        fs: dev.fs,
      },
      plugins: [
        vue(),
        yaml(),
        unocss({
          presets: [
            mini({
              preflight: false,
            }),
          ],
        }),
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

    this.ctx.server.all('/vite(/.+)*', (ctx) => new Promise((resolve) => {
      this.vite.middlewares(ctx.req, ctx.res, resolve)
    }))

    this.ctx.on('dispose', () => this.vite.close())
  }

  stop() {
    this.layer.close()
  }
}

namespace NodeConsole {
  export interface Dev {
    fs: FileSystemServeOptions
  }

  export const Dev: Schema<Dev> = Schema.object({
    fs: Schema.object({
      strict: Schema.boolean().default(true),
      allow: Schema.array(String).default(null),
      deny: Schema.array(String).default(null),
    }).hidden(),
  })

  export interface Head {
    tag: string
    attrs?: Dict<string>
    content?: string
  }

  export const Head: Schema<Head> = Schema.object({
    tag: Schema.string().required(),
    attrs: Schema.dict(Schema.string()).role('table'),
    content: Schema.string().role('textarea'),
  })

  export interface Config {
    root?: string
    uiPath?: string
    devMode?: boolean
    cacheDir?: string
    open?: boolean
    head?: Head[]
    selfUrl?: string
    apiPath?: string
    heartbeat?: HeartbeatConfig
    dev?: Dev
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      root: Schema.string().hidden(),
      uiPath: Schema.string().default(''),
      apiPath: Schema.string().default('/status'),
      selfUrl: Schema.string().role('link').default(''),
      open: Schema.boolean(),
      head: Schema.array(Head),
      heartbeat: Schema.object({
        interval: Schema.number().default(Time.second * 30),
        timeout: Schema.number().default(Time.minute),
      }),
      devMode: Schema.boolean().default(process.env.NODE_ENV === 'development').hidden(),
      cacheDir: Schema.string().default('cache/vite').hidden(),
      dev: Dev,
    }),
  ]).i18n({
    'zh-CN': require('./locales/zh-CN'),
  })
}

export default NodeConsole
