import Koa from 'koa'
import Router from '@koa/router'
import { readFile } from 'fs/promises'
import { extname, resolve } from 'path'
import { createReadStream, existsSync } from 'fs'

const app = new Koa()
const router = new Router()

app.use(router.routes())
app.use(router.allowedMethods())

const root = resolve(require.resolve('@koishijs/play/package.json'), '../dist')
const endpoint = 'https://registry.koishi.chat'

router.get('(/.+)*', async (ctx, next) => {
  if (ctx.path !== '/' && existsSync(root + ctx.path)) {
    ctx.type = extname(ctx.path)
    ctx.body = createReadStream(root + ctx.path)
    return
  }
  const template = await readFile(root + '/index.html', 'utf8')
  ctx.type = 'html'
  ctx.body = transformHtml(template)
})

function transformHtml(template: string) {
  const headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify({
    static: true,
    uiPath: '/',
    endpoint,
  })}</script>`
  return template.replace('</title>', '</title>' + headInjection)
}

app.listen(3000)
