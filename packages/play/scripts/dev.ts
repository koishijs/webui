import { createReadStream, Stats } from 'fs'
import { readFile, stat } from 'fs/promises'
import { extname, resolve } from 'path'
import { ViteDevServer } from 'vite'
import { noop } from '@koishijs/utils'
import yaml from '@rollup/plugin-yaml'
import Koa from 'koa'
import Router from '@koa/router'

const app = new Koa()
const router = new Router()

app.use(router.routes())
app.use(router.allowedMethods())

const uiPath = ''
const root = resolve(require.resolve('@koishijs/play/package.json'), '../app')

let vite: ViteDevServer

router.get(uiPath + '(/.+)*', async (ctx, next) => {
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
  const filename = resolve(root, name)
  if (!filename.startsWith(root) && !filename.includes('node_modules')) {
    return ctx.status = 403
  }
  const stats = await stat(filename).catch<Stats>(noop)
  if (stats?.isFile()) return sendFile(filename)
  const ext = extname(filename)
  if (ext && ext !== '.html') return ctx.status = 404
  const template = await readFile(resolve(root, 'index.html'), 'utf8')
  ctx.type = 'html'
  ctx.body = await transformHtml(template)
})

const browserEntries = {
  '@koishijs/plugin-console': '../src/browser/index.ts',
  '@koishijs/plugin-market': '../src/browser/index.ts',
}

router.get('(/.+)*/sql-wasm.wasm', async (ctx) => {
  const filename = require.resolve('@minatojs/sql.js/dist/sql-wasm.wasm')
  ctx.body = createReadStream(filename)
  ctx.type = 'application/wasm'
})

router.get('/modules(/.+)+/index.js', async (ctx) => {
  const name = ctx.params[0].slice(1)
  try {
    const entry = resolve(require.resolve(name + '/package.json'), browserEntries[name] || '../src/index.ts')
    ctx.redirect(`/vite/@fs${entry}`)
  } catch {
    ctx.body = 'throw new Error()'
    ctx.type = '.js'
  }
})

async function transformHtml(template: string) {
  template = await vite.transformIndexHtml(uiPath, template)
  const headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify({
    static: true,
    devMode: true,
    uiPath,
    endpoint: '',
  })}</script>`
  return template.replace('</title>', '</title>' + headInjection)
}

async function createVite() {
  const { createServer } = require('vite') as typeof import('vite')
  const { default: vue } = require('@vitejs/plugin-vue') as typeof import('@vitejs/plugin-vue')

  vite = await createServer({
    root,
    base: '/vite/',
    cacheDir: resolve(__dirname, '../.cache'),
    server: {
      middlewareMode: true,
      fs: {
        strict: false,
      },
    },
    plugins: [vue(), yaml() as any],
    resolve: {
      extensions: ['.ts', '.js', '.json', '.yml', '.yaml'],
      dedupe: ['vue', 'vue-demi', 'vue-router', 'element-plus', '@vueuse/core', '@popperjs/core'],
      alias: {
        '@koishijs/core': '@koishijs/core/src/index.ts',
        '@koishijs/plugin-console': '@koishijs/plugin-console/src/browser/index.ts',
        '@minatojs/driver-sqlite': '@minatojs/driver-sqlite/src/index.ts',
        '@minatojs/sql-utils': '@minatojs/sql-utils/src/index.ts',
        'path': 'rollup-plugin-node-polyfills/polyfills/path',
        'fs': 'fsa-browserify/src/index.ts',
      },
    },
    define: {
      'process.cwd': '() => "/"',
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.KOISHI_BASE': 'null',
      'process.env.KOISHI_ENV': JSON.stringify('browser'),
    },
    optimizeDeps: {
      include: [
        'schemastery',
        'element-plus',
        'supports-color',
        'rollup-plugin-node-polyfills/polyfills/path',
        'marked',
        'xss',
        'semver',
        'spark-md5',
      ],
    },
    build: {
      rollupOptions: {
        input: root + '/index.html',
      },
    },
  })

  router.all('/vite(/.+)*', (ctx) => new Promise((resolve) => {
    vite.middlewares(ctx.req, ctx.res, resolve)
  }))

  return vite
}

createVite()

app.listen(3000)
