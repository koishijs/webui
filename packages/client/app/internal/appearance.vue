<template>
  <k-content>
    <k-form v-model="config" :initial="config" :schema="schema"></k-form>
  </k-content>
</template>

<script lang="ts" setup>

import { config } from '@koishijs/client'
import { Schema } from '@koishijs/components'

const schema = Schema.object({
  theme: Schema.object({
    mode: Schema.union([
      Schema.const('auto').description('跟随系统'),
      Schema.const('dark').description('深色'),
      Schema.const('light').description('浅色'),
    ]).description('主题偏好。'),
    dark: Schema.string().role('theme', { mode: 'dark' }).description('深色主题。'),
    light: Schema.string().role('theme', { mode: 'light' }).description('浅色主题。'),
  }).description('主题设置'),
})

</script>

<style lang="scss" scoped>

</style>
