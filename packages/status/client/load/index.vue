<template>
  <k-status v-if="store.status">
    <template #tooltip>
      <div class="load">
        <load-bar title="CPU" :rate="store.status.cpu"/>
        <load-bar title="内存" :rate="store.status.memory"/>
      </div>
    </template>
    CPU: {{ percentage(store.status.cpu[1], 0) }}
    内存: {{ percentage(store.status.memory[1], 0) }}
  </k-status>
</template>

<script setup lang="ts">

import LoadBar from './load-bar.vue'
import { store } from '@koishijs/client'
import { percentage } from './utils'

</script>

<style lang="scss" scoped>

.load {
  padding: 0.25rem 1rem;
}

</style>
