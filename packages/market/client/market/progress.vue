<template>
  <k-status v-if="isLoading">
    <el-progress :indeterminate="!store.market" :percentage="percentage">
      正在加载插件市场
    </el-progress>
  </k-status>
</template>

<script lang="ts" setup>

import { store, activities, root } from '@koishijs/client'
import { computed } from 'vue'

const isLoading = computed(() => {
  if (root.bail('activity', activities['market'])) return false
  return !store.market || store.market.total > store.market.progress
})

const percentage = computed(() => {
  if (!store.market) return 50
  return 100 * store.market.progress / store.market.total
})

</script>

<style lang="scss">

.k-status .el-progress-bar {
  width: 120px;
  margin-right: 2px;
}

</style>
