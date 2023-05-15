<template>
  <k-markdown unsafe class="usage" v-if="data.local.runtime?.usage" :source="data.local.runtime?.usage"></k-markdown>
</template>

<script lang="ts" setup>

import { SettingsData } from '../utils'

defineProps<{
  data: SettingsData
}>()

</script>

<style lang="scss">

.plugin-view {
  .markdown.usage {
    margin-bottom: 2rem;

    h2 {
      font-size: 1.25rem;
    }
  }
}

</style>
