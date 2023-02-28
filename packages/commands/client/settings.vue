<template>
  <template v-for="data in commands" :key="data.name">
    <div v-if="data.paths.includes(current.path)">
      <h2 class="k-schema-header">指令：{{ data.name }}</h2>
      <k-form :schema="commandSchema" :show-header="false"></k-form>
    </div>
  </template>
</template>

<script lang="ts" setup>

import { inject, computed, ref } from 'vue'
import { commands, commandSchema } from './utils'

const current: any = inject('manager.settings.current')

</script>

<style lang="scss" scoped>

</style>
