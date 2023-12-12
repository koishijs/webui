<template>
  <k-comment type="danger">
    <p>此插件尚未安装，<span class="link" @click="gotoMarket">点击前往插件市场</span>。</p>
  </k-comment>
</template>

<script setup lang="ts">

import { inject, WritableComputedRef } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const current = inject<WritableComputedRef<any>>('manager.settings.current')

function gotoMarket() {
  router.push('/market?keyword=' + current.value.name)
}

</script>

<style lang="scss" scoped>

.link {
  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
}

</style>
