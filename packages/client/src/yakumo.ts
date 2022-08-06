import { Module } from 'module'
import { UserConfig } from 'vite'
import { register } from 'yakumo'
import { buildExtension } from '.'
import ns from 'ns-require'

declare module 'yakumo' {
  interface Config {
    client?: string
  }
}

register('client', async (project) => {
  for (const path in project.targets) {
    const meta = project.targets[path]
    let config: UserConfig = {}
    if (meta.yakumo?.client) {
      const require = Module.createRequire(project.cwd + path + '/package.json')
      config = ns.unwrapExports(require(meta.yakumo.client))
    }
    await buildExtension(project.cwd + path, config)
  }
})
