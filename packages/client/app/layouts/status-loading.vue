<template>
  <k-status v-if="progress < 1">
    <el-progress :indeterminate="!store.entry" :percentage="progress * 100">
      正在加载页面组件
    </el-progress>
  </k-status>
</template>

<script lang="ts" setup>

import { store, progress } from '@koishijs/client'

</script>
