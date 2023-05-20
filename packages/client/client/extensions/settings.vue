<template>
  <k-layout main="darker page-settings">
    <k-content>
      <k-schema :schema="schema" :initial="config" v-model="config"></k-schema>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { config, Schema } from '..'

const schema = Schema.object({
  isDark: Schema.boolean().description('暗色模式。'),
  locale: Schema.union(['zh-CN', 'en-US']).hidden().description('语言设置。'),
}).description('外观设置')

</script>

<style lang="scss">

</style>
