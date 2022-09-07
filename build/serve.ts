import Koa from 'koa'
import Router from '@koa/router'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const app = new Koa()
const router = new Router()

app.use(router.routes())
app.use(router.allowedMethods())

const endpoint = 'https://koishi.js.org/registry/modules'
const filename = resolve(require.resolve('@koishijs/plugin-console/package.json'), '../dist/index.html')

router.get('(/.+)*', async (ctx, next) => {
  const template = await readFile(filename, 'utf8')
  ctx.type = 'html'
  ctx.body = transformHtml(template)
})

function transformHtml(template: string) {
  template = template.replace(/(href|src)="(?=\/)/g, (_, $1) => `${$1}="${endpoint}/@koishijs/plugin-console/dist`)
  const headInjection = `<script>KOISHI_CONFIG = ${JSON.stringify({
    static: true,
    uiPath: '/',
    endpoint,
  })}</script>`
  return template.replace('</title>', '</title>' + headInjection)
}

app.listen(3000)
