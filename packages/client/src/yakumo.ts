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
    const deps = {
      ...meta.dependencies,
      ...meta.devDependencies,
      ...meta.peerDependencies,
      ...meta.optionalDependencies,
    }
    let config: UserConfig = {}
    if (meta.yakumo?.client) {
      const require = createRequire(project.cwd + path + '/package.json')
      const exports = ns.unwrapExports(require(meta.yakumo.client))
      if (typeof exports === 'function') {
        await exports()
        continue
      }
      config = exports
    } else if (!deps['@koishijs/client']) {
      continue
    }
    await buildExtension(project.cwd + path, config)
  }
})
