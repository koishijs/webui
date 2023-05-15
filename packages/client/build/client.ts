import { RollupOutput } from 'rollup'
import { appendFile, copyFile } from 'fs/promises'
import { resolve } from 'path'
import * as vite from 'vite'
import vue from '@vitejs/plugin-vue'
import yaml from '@maikolib/vite-plugin-yaml'

function findModulePath(id: string) {
  const path = require.resolve(id).replace(/\\/g, '/')
  const keyword = `/node_modules/${id}/`
  return path.slice(0, path.indexOf(keyword)) + keyword.slice(0, -1)
}

const cwd = resolve(__dirname, '../../..')
const dist = cwd + '/plugins/console/dist'

export async function build(root: string, config: vite.UserConfig = {}, isClient = false) {
  const { rollupOptions = {} } = config.build || {}
  return await vite.build({
    root,
    build: {
      outDir: cwd + '/plugins/console/dist',
      emptyOutDir: true,
      cssCodeSplit: false,
      ...config.build,
      rollupOptions: {
        ...rollupOptions,
        makeAbsoluteExternalsRelative: true,
        external: [
          root + '/vue.js',
          root + '/vue-i18n.js',
          root + '/vue-router.js',
          root + '/client.js',
          root + '/vueuse.js',
          root + '/intlify.js',
        ],
        output: {
          format: 'module',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          ...rollupOptions.output,
        },
      },
    },
    plugins: [
      vue(),
      yaml(),
    ],
    resolve: {
      alias: {
        'vue': root + '/vue.js',
        'vue-i18n': root + '/vue-i18n.js',
        'vue-router': root + '/vue-router.js',
        '@vueuse/core': root + '/vueuse.js',
        '@koishijs/client': root + '/client.js',
        '@intlify/core-base': root + '/intlify.js',
      },
    },
  }) as RollupOutput
}

export default async function () {
  // build for console main
  const { output } = await build(cwd + '/packages/client/app')

  await Promise.all([
    copyFile(findModulePath('vue') + '/dist/vue.runtime.esm-browser.prod.js', dist + '/vue.js'),
    build(findModulePath('@intlify/core-base') + '/dist', {
      build: {
        outDir: dist,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            'intlify': findModulePath('@intlify/core-base') + '/dist/core-base.esm-browser.js',
          },
          preserveEntrySignatures: 'strict',
        },
      },
    }),
    build(findModulePath('vue-i18n') + '/dist', {
      build: {
        outDir: dist,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            'vue-i18n': findModulePath('vue-i18n') + '/dist/vue-i18n.esm-browser.js',
          },
          preserveEntrySignatures: 'strict',
        },
      },
    }),
    build(findModulePath('vue-router') + '/dist', {
      build: {
        outDir: dist,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            'vue-router': findModulePath('vue-router') + '/dist/vue-router.esm-browser.js',
          },
          preserveEntrySignatures: 'strict',
        },
      },
    }),
    build(findModulePath('@vueuse/core'), {
      build: {
        outDir: dist,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            'vueuse': findModulePath('@vueuse/core') + '/index.mjs',
          },
          preserveEntrySignatures: 'strict',
        },
      },
    }),
  ])

  await build(cwd + '/packages/client/client', {
    build: {
      outDir: dist,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          'client': cwd + '/packages/client/client/index.ts',
        },
        output: {
          manualChunks: {
            element: ['element-plus'],
          },
        },
        preserveEntrySignatures: 'strict',
      },
    },
  }, true)

  for (const file of output) {
    if (file.type === 'asset' && file.name === 'style.css') {
      await appendFile(dist + '/style.css', file.source)
    }
  }
}
