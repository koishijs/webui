import { createReadStream, Stats } from 'fs'
import { readFile, stat } from 'fs/promises'
import { extname, resolve } from 'path'
import { ViteDevServer } from 'vite'
import { noop } from '@koishijs/utils'
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

export function locateEntry(meta) {
  if (typeof meta.exports === 'string') {
    return meta.exports
  } else if (meta.exports) {
    const entry = meta.exports['.']
    if (typeof entry === 'string') {
      return entry
    } else {
      const result = entry.browser || entry.import || entry.default
      if (typeof result === 'string') return result
    }
  }
  return meta.module
}

router.get('/modules(/.+)+/index.js', async (ctx) => {
  let name = ctx.params[0].slice(1)
  if (name === 'koishi') name = '@koishijs/core'
  const meta = require(name + '/package.json')
  const entry = resolve(require.resolve(name + '/package.json'), '..', locateEntry(meta))
  ctx.redirect(`/vite/@fs${entry}`)
})

async function transformHtml(template: string) {
  template = await vite.transformIndexHtml(uiPath, template)
  const headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify({
    client: true,
    devMode: true,
    uiPath,
    endpoint: '/modules',
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
    plugins: [vue()],
    resolve: {
      dedupe: ['vue'],
      alias: {
        'koishi': '@koishijs/core/lib/index.mjs',
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
