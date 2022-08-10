import { createRequire } from 'module'
import { UserConfig } from 'vite'
import { register } from 'yakumo'
import { buildExtension } from '.'
import ns from 'ns-require'

declare module 'yakumo' {
  interface PackageConfig {
    client?: string
  }
}

register('client', async (project) => {
  for (const path in project.targets) {
    const meta = project.targets[path]
    let config: UserConfig = {}
    if (meta.yakumo?.client) {
      const require = createRequire(project.cwd + path + '/package.json')
      const exports = ns.unwrapExports(require(meta.yakumo.client))
      if (typeof exports === 'function') {
        await exports()
        break
      }
      config = exports
    }
    await buildExtension(project.cwd + path, config)
  }
})
