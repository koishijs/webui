<template>
  <template v-if="logs?.length">
    <h2 class="k-schema-header">
      运行日志
    </h2>
    <logs class="settings-logger" :logs="logs" max-height="216px"/>
  </template>
</template>

<script setup lang="ts">

import { store } from '@koishijs/client'
import { inject, computed } from 'vue'
import Logs from './logs.vue'

const current: any = inject('manager.settings.current')

const logs = computed(() => {
  if (!store.logs) return []
  const results = []
  let last = Infinity
  for (let index = store.logs.length - 1; index > 0; --index) {
    if (store.logs[index].id >= last) break
    last = store.logs[index].id
    if (!store.logs[index].meta?.paths?.includes(current.value.path)) continue
    results.unshift(store.logs[index])
  }
  return results
})

</script>

<style scoped lang="scss">

.settings-logger {
  border-radius: 8px;
  :deep(.logs) {
    padding: 0.5rem 0.5rem;
  }
}

</style>
