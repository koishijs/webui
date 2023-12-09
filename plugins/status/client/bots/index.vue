<template>
  <k-status v-if="store.status">
    <template #tooltip>
      <span v-if="!Object.values(store.status.bots).length" class="el-popper__empty"></span>
      <bot-preview v-for="(bot, key) in store.status.bots" :key="key" :data="bot"></bot-preview>
    </template>
    <status-light v-for="(bot, key) in store.status.bots" :key="key" :class="getStatus(bot.status)"></status-light>
    <k-icon name="arrow-up"/>
    <span>{{ sent }}/min</span>
    <k-icon name="arrow-down"/>
    <span>{{ received }}/min</span>
  </k-status>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { store } from '@koishijs/client'
import { getStatus } from './utils'
import BotPreview from './preview.vue'
import StatusLight from './light.vue'

const sent = computed(() => {
  return Object.values(store.status.bots).reduce((acc, bot) => acc + bot.messageSent, 0)
})

const received = computed(() => {
  return Object.values(store.status.bots).reduce((acc, bot) => acc + bot.messageReceived, 0)
})

</script>

<style lang="scss" scoped>

.k-status {
  .k-icon {
    margin-right: 4px;
  }

  * + .k-icon {
    margin-left: 6px;
  }
}

</style>
