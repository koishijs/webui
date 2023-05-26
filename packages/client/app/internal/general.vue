<template>
  <k-content>
    <k-schema :schema="schema" :initial="config" v-model="config"></k-schema>
  </k-content>
</template>

<script lang="ts" setup>

import { config, Schema } from '@koishijs/client'

const schema = Schema.object({
  locale: Schema.union(['zh-CN', 'en-US']).description('语言设置。'),
}).description('通用设置')

</script>

<style lang="scss">

</style>
