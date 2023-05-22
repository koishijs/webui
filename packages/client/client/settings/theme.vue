<template>
  <k-content>
    <k-schema :schema="schema" :initial="config" v-model="config"></k-schema>
  </k-content>
</template>

<script lang="ts" setup>

import { config, Schema } from '..'

const schema = Schema.object({
  isDark: Schema.boolean().description('暗色模式。'),
}).description('外观设置')

</script>

<style lang="scss">

</style>
