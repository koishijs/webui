import * as vite from 'vite'
import { RollupOutput } from 'rollup'
import { existsSync, promises as fsp } from 'fs'
import unocss from 'unocss/vite'
import mini from 'unocss/preset-mini'
import vue from '@vitejs/plugin-vue'
import yaml from '@maikolib/vite-plugin-yaml'
import { resolve } from 'path'

export async function build(root: string, config: vite.UserConfig = {}) {
  if (!existsSync(root + '/client')) return

  const outDir = root + '/dist'
  if (existsSync(outDir)) {
    await fsp.rm(outDir, { recursive: true })
  }
  await fsp.mkdir(root + '/dist', { recursive: true })

  const results = await vite.build(vite.mergeConfig({
    root,
    build: {
      write: false,
      outDir: 'dist',
      assetsDir: '',
      minify: true,
      emptyOutDir: true,
      commonjsOptions: {
        strictRequires: true,
      },
      lib: {
        entry: root + '/client/index.ts',
        fileName: 'index',
        formats: ['es'],
      },
      rollupOptions: {
        makeAbsoluteExternalsRelative: true,
        external: [
          'vue',
          'vue-router',
          '@vueuse/core',
          '@koishijs/client',
        ],
        output: {
          format: 'iife',
        },
      },
    },
    plugins: [
      vue(),
      yaml(),
      unocss({
        presets: [
          mini({
            preflight: false,
          }),
        ],
      }),
    ],
    resolve: {
      alias: {
        'vue-i18n': '@koishijs/client',
        '@koishijs/components': '@koishijs/client',
      },
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  } as vite.InlineConfig, config)) as RollupOutput[]

  for (const item of results[0].output) {
    if (item.fileName === 'index.mjs') item.fileName = 'index.js'
    const dest = root + '/dist/' + item.fileName
    if (item.type === 'asset') {
      await fsp.writeFile(dest, item.source)
    } else {
      const result = await vite.transformWithEsbuild(item.code, dest, {
        minifyWhitespace: true,
        charset: 'utf8',
      })
      await fsp.writeFile(dest, result.code)
    }
  }
}

export function createServer(baseDir: string, config?: vite.InlineConfig) {
  const root = resolve(__dirname, '../app')
  return vite.createServer(vite.mergeConfig({
    root,
    base: '/vite/',
    server: {
      middlewareMode: true,
      fs: {
        allow: [
          vite.searchForWorkspaceRoot(baseDir),
        ],
      },
    },
    plugins: [
      vue(),
      yaml(),
      unocss({
        presets: [
          mini({
            preflight: false,
          }),
        ],
      }),
    ],
    resolve: {
      dedupe: ['vue', 'vue-demi', 'vue-router', 'element-plus', '@vueuse/core', '@popperjs/core', 'marked', 'xss'],
      alias: {
        // for backward compatibility
        '../client.js': '@koishijs/client',
        '../vue.js': 'vue',
        '../vue-router.js': 'vue-router',
        '../vueuse.js': '@vueuse/core',
      },
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'element-plus',
        '@vueuse/core',
        '@popperjs/core',
        'marked',
        'xss',
      ],
    },
    build: {
      rollupOptions: {
        input: root + '/index.html',
      },
    },
  } as vite.InlineConfig, config))
}
