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
const root = resolve(require.resolve('@koishijs/client/package.json'), '../app')

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
  '@koishijs/loader': '../src/browser.ts',
  '@koishijs/plugin-console': '../src/browser/index.ts',
  '@koishijs/plugin-market': '../src/browser/index.ts',
}

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
    plugins: [vue(), yaml()],
    resolve: {
      extensions: ['.ts', '.js', '.json', '.yml', '.yaml'],
      dedupe: ['vue'],
      alias: {
        'koishi': '@koishijs/core/src/index.ts',
        '@koishijs/loader': '@koishijs/loader/src/browser.ts',
        '@koishijs/plugin-console': '@koishijs/plugin-console/src/browser/index.ts',
        'path': 'rollup-plugin-node-polyfills/polyfills/path',
      },
    },
    define: {
      'process.env.KOISHI_BASE': 'null',
      'process.env.KOISHI_ENV': JSON.stringify('browser'),
    },
    optimizeDeps: {
      include: [
        'schemastery',
        'element-plus',
        'supports-color',
        'rollup-plugin-node-polyfills/polyfills/path',
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
