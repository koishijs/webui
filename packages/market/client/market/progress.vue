<template>
  <k-status v-if="store.market && store.market.total > store.market.progress">
    <el-progress :indeterminate="!store.market.total" :percentage="100 * store.market.progress / store.market.total">
      正在加载插件市场
    </el-progress>
  </k-status>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'

</script>

<style lang="scss">

.k-status .el-progress-bar {
  width: 120px;
  margin-right: 2px;
}

</style>
