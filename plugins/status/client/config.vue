<template>
  <template v-if="bots?.length">
    <h2 class="k-schema-header">
      机器人
    </h2>
    <div class="bots-container">
      <bot-preview v-for="(bot, sid) in bots" :key="sid" :data="bot"/>
    </div>
  </template>
</template>

<script setup lang="ts">

import { store } from '@koishijs/client'
import { inject, computed } from 'vue'
import BotPreview from './bots/preview.vue'

const current: any = inject('manager.settings.current')

const bots = computed(() => {
  return Object.values(store.status?.bots || {}).filter(bot => {
    return bot.paths?.includes(current.value.path)
  })
})

</script>

<style scoped lang="scss">

.bots-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  .bot-view {
    background-color: var(--bg0);
    border-radius: 0.5rem;
  }
}

</style>
