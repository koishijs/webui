<template>
  <k-layout main="darker page-settings">
    <k-content>
      <k-schema :schema="schema" :initial="config" v-model="config"></k-schema>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { Schema } from '@koishijs/client'
import { useDark } from '@vueuse/core'
import { computed } from 'vue'

const isDark = useDark()

const schema = Schema.object({
  isDark: Schema.boolean().description('暗色模式。'),
}).description('外观设置')

const config = computed({
  get() {
    return { isDark: isDark.value }
  },
  set(value) {
    isDark.value = value?.isDark
  },
})

</script>

<style lang="scss">

.page-settings {
}

</style>
