import Koa from 'koa'
import Router from '@koa/router'
import { extname, resolve } from 'path'
import { createReadStream, existsSync } from 'fs'

const app = new Koa()
const router = new Router()

app.use(router.routes())
app.use(router.allowedMethods())

const root = resolve(require.resolve('@koishijs/online/package.json'), '../dist')

router.get('(/.+)*', async (ctx, next) => {
  let filename = root + ctx.path
  if (ctx.path.endsWith('/') || !existsSync(root + ctx.path)) {
    filename = root + '/index.html'
  }
  ctx.type = extname(filename)
  ctx.body = createReadStream(filename)
  return next()
})

app.listen(3000)
