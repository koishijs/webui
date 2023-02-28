<template>
  <div v-if="active.startsWith('commands.') && store.commands" class="navigation">
    <router-link
      class="k-button"
      :to="'/commands/' + active.slice(9).replace(/\./, '/')"
    >前往指令</router-link>
  </div>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'

defineProps<{
  active: string
}>()

</script>

<style lang="scss" scoped>

.navigation {
  margin-bottom: 2rem;
  display: flex;
  gap: 0.5rem 1rem;
  flex-wrap: wrap;
}

</style>
