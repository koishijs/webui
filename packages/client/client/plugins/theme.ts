import { Dict } from 'cosmokit'
import { Schema } from '@koishijs/components'
import { Context } from '../context'
import { Component, computed, markRaw, reactive, watchEffect } from 'vue'
import { useConfig } from './setting'
import { Service } from '../utils'
import { usePreferredDark } from '@vueuse/core'

declare module '../context' {
  interface Context {
    $theme: ThemeService
    theme(options: ThemeOptions): () => void
  }

  interface Internal {
    themes: Dict<ThemeOptions>
  }
}

declare module '..' {
  interface Config {
    theme: Config.Theme
  }

  export namespace Config {
    export interface Theme {
      mode: 'auto' | 'dark' | 'light'
      dark: string
      light: string
    }
  }
}

export interface ThemeOptions {
  id: string
  name: string | Dict<string>
  components?: Dict<Component>
}

const preferDark = usePreferredDark()

const config = useConfig()

const colorMode = computed(() => {
  const mode = config.value.theme.mode
  if (mode !== 'auto') return mode
  return preferDark.value ? 'dark' : 'light'
})

export const useColorMode = () => colorMode

export default class ThemeService extends Service {
  constructor(ctx: Context) {
    super(ctx, '$theme', true)
    ctx.mixin('$theme', ['theme'])

    ctx.internal.themes = reactive({})

    ctx.settings({
      id: 'appearance',
      title: '外观设置',
      order: 900,
      schema: Schema.object({
        theme: Schema.object({
          mode: Schema.union([
            Schema.const('auto').description('跟随系统'),
            Schema.const('dark').description('深色'),
            Schema.const('light').description('浅色'),
          ]).default('auto').description('主题偏好。'),
          dark: Schema.string().role('theme', { mode: 'dark' }).default('default-dark').description('深色主题。'),
          light: Schema.string().role('theme', { mode: 'light' }).default('default-light').description('浅色主题。'),
        }).description('主题设置'),
      }),
    })

    ctx.effect(() => watchEffect(() => {
      if (!config.value.theme) return
      const root = window.document.querySelector('html')
      root.setAttribute('theme', config.value.theme[colorMode.value])
      if (colorMode.value === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }, { flush: 'post' }))
  }

  theme(options: ThemeOptions) {
    markRaw(options)
    const caller = this[Context.current]
    for (const [type, component] of Object.entries(options.components || {})) {
      caller.slot({
        type,
        disabled: () => config.value.theme[colorMode.value] !== options.id,
        component,
      })
    }
    return caller.effect(() => {
      this.ctx.internal.themes[options.id] = options
      return () => delete this.ctx.internal.themes[options.id]
    })
  }
}
