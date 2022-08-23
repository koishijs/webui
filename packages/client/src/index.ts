import { build, InlineConfig, mergeConfig, UserConfig } from 'vite'
import { existsSync, promises as fsp } from 'fs'
import vue from '@vitejs/plugin-vue'

export async function buildExtension(root: string, config: UserConfig = {}) {
  if (!existsSync(root + '/client')) return

  await build(mergeConfig({
    root,
    build: {
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
        external: [
          root + '/vue.js',
          root + '/vue-router.js',
          root + '/vueuse.js',
          root + '/client.js',
        ],
        output: {
          format: 'iife',
        },
      },
    },
    plugins: [vue()],
    resolve: {
      alias: {
        'koishi': '@koishijs/core',
        'vue': root + '/vue.js',
        'vue-router': root + '/vue-router.js',
        '@vueuse/core': root + '/vueuse.js',
        '@koishijs/client': root + '/client.js',
      },
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  } as InlineConfig, config))

  await fsp.rename(root + '/dist/index.mjs', root + '/dist/index.js')
}
