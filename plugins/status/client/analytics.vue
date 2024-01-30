<template>
  <analytic-number icon="analytic:pulse" title="当前 QPS">
    <template #default>{{ +current.toFixed(2) }}</template>
    <template #footer-left>近期 QPS</template>
    <template #footer-right>{{ +recent.toFixed(2) }}</template>
  </analytic-number>
</template>

<script setup lang="ts">

import { computed, inject } from 'vue'
import { store } from '@koishijs/client'
import {} from '@koishijs/plugin-analytics/src'

const AnalyticNumber = inject('component:analytic-number')

const current = computed(() => {
  return Object.values(store.status.bots).reduce((acc, bot) => acc + bot.messageReceived, 0) / 60
})

const recent = computed(() => {
  return Object.values(store.analytics.messageByDate).slice(-7).reduce((acc, value) => acc + value.receive, 0) / 7 / 24 / 60 / 60
})

</script>
