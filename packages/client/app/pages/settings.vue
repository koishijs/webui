<template>
  <k-layout main="darker page-settings">
    <k-content>
      <k-schema :schema="schema" :initial="config" v-model="config"></k-schema>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { i18n, Schema } from '@koishijs/client'
import { useDark } from '@vueuse/core'
import { computed } from 'vue'

const isDark = useDark()

const schema = Schema.object({
  isDark: Schema.boolean().description('暗色模式。'),
  locale: Schema.union(['zh-CN', 'en-US']).hidden().description('语言设置。'),
}).description('外观设置')

const config = computed({
  get() {
    return { isDark: isDark.value, locale: i18n.global.locale.value }
  },
  set(value) {
    isDark.value = value?.isDark
    i18n.global.locale.value = value?.locale
  },
})

</script>

<style lang="scss">

.page-settings {
}

</style>
