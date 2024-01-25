import { build, InlineConfig, mergeConfig, transformWithEsbuild, UserConfig } from 'vite'
import { RollupOutput } from 'rollup'
import { existsSync, promises as fsp } from 'fs'
import unocss from 'unocss/vite'
import mini from 'unocss/preset-mini'
import vue from '@vitejs/plugin-vue'
import yaml from '@maikolib/vite-plugin-yaml'

export async function buildExtension(root: string, config: UserConfig = {}) {
  if (!existsSync(root + '/client')) return

  const outDir = root + '/dist'
  if (existsSync(outDir)) {
    await fsp.rm(outDir, { recursive: true })
  }
  await fsp.mkdir(root + '/dist', { recursive: true })

  const results = await build(mergeConfig({
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
  } as InlineConfig, config)) as RollupOutput[]

  for (const item of results[0].output) {
    if (item.fileName === 'index.mjs') item.fileName = 'index.js'
    const dest = root + '/dist/' + item.fileName
    if (item.type === 'asset') {
      await fsp.writeFile(dest, item.source)
    } else {
      const result = await transformWithEsbuild(item.code, dest, {
        minifyWhitespace: true,
        charset: 'utf8',
      })
      await fsp.writeFile(dest, result.code)
    }
  }
}
