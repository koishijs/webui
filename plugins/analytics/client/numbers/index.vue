<template>
  <div class="card-grid numeric-grid" v-if="store.analytics">
    <k-slot name="analytic-number">
      <k-slot-item>
        <numeric icon="analytic:user" title="用户数量">
          <template #default>{{ store.analytics.userCount }}</template>
          <template #footer-left>昨日新增用户</template>
          <template #footer-right>{{ store.analytics.userIncrement }}</template>
        </numeric>
        <numeric icon="analytic:guild" title="群组数量">
          <template #default>{{ store.analytics.guildCount }}</template>
          <template #footer-left>昨日新增群组</template>
          <template #footer-right>{{ store.analytics.guildIncrement }}</template>
        </numeric>
        <numeric icon="analytic:heart" title="今日 DAU">
          <template #default>{{ store.analytics.dauHistory[0] }}</template>
          <template #footer-left>近期 DAU</template>
          <template #footer-right>{{ +recentDau.toFixed(1) }}</template>
        </numeric>
      </k-slot-item>
    </k-slot>
  </div>
</template>

<script setup lang="ts">

import { provide, computed } from 'vue'
import { store } from '@koishijs/client'
import {} from '@koishijs/plugin-analytics/src'
import Numeric from './numeric.vue'

provide('component:analytic-number', Numeric)

const recentDau = computed(() => {
  const data = store.analytics.dauHistory.slice(1)
  const historyLength = store.analytics.dauHistory.length - 1
  if (!historyLength) return 0
  return data.reduce((a, b) => a + b, 0) / Math.min(data.length, historyLength)
})

</script>

<style lang="scss" scoped>

.numeric-grid {
  grid-template-columns: repeat(4, 1fr);

  @media screen and (max-width: 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

</style>
