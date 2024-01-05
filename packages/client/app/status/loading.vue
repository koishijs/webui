<template>
  <k-status v-if="progress < 1">
    <el-progress :indeterminate="!store.entry" :percentage="progress * 100">
      正在加载页面组件
    </el-progress>
  </k-status>
</template>

<script lang="ts" setup>

import { store, useContext } from '@koishijs/client'
import { computed } from 'vue'

const ctx = useContext()

const progress = computed(() => {
  const states = Object.values(ctx.internal.extensions)
  return states.filter(state => state.done.value).length / states.length
})

</script>
