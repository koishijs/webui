<template>
  <k-status>
    <template #tooltip>
      <bot-preview v-for="(bot, key) in store.profile.bots" :key="key" :data="bot"></bot-preview>
    </template>
    <span style="margin-right: 8px">
      <k-icon name="arrow-up"/>
      <span>{{ sent }}/min</span>
    </span>
    <span>
      <k-icon name="arrow-down"/>
      <span>{{ received }}/min</span>
    </span>
  </k-status>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { store } from '@koishijs/client'
import BotPreview from './preview.vue'

const sent = computed(() => {
  return Object.values(store.profile.bots).reduce((acc, bot) => acc + bot.messageSent, 0)
})

const received = computed(() => {
  return Object.values(store.profile.bots).reduce((acc, bot) => acc + bot.messageReceived, 0)
})

</script>
