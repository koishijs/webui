import { mkdir, mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { App } from 'koishi'
import { expect, use } from 'chai'
import promise from 'chai-as-promised'
import Explorer from '../src'

use(promise)

describe('@koishijs/plugin-explorer', () => {
  it('rejects parent directory traversal', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'koishi-explorer-'))
    const rootDir = join(baseDir, 'root')
    const outsideFile = join(baseDir, 'outside.txt')
    const app = new App({ baseDir }) as App & { console: any }
    const listeners = Object.create(null)

    app.console = {
      addEntry() {},
      addListener(type: string, callback: (...args: any[]) => any) {
        listeners[type] = { callback }
      },
    }

    await mkdir(rootDir)
    await writeFile(outsideFile, 'secret', 'utf8')
    new Explorer(app, { root: 'root', ignored: [] })

    const listener = listeners['explorer/read']
    await expect(listener.callback('../outside.txt')).to.be.rejectedWith('invalid path')

    await expect(readFile(outsideFile, 'utf8')).to.eventually.equal('secret')
    await rm(baseDir, { recursive: true, force: true })
  })
})
