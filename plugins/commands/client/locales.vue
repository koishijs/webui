<template>
  <div v-if="data.active.startsWith('commands.') && store.commands" class="navigation flex flex-wrap gap-x-4 gap-y-2 my-8">
    <router-link
      class="k-button"
      :to="'/commands/' + data.active.slice(9).replace(/\./, '/')"
    >前往指令</router-link>
  </div>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'

defineProps<{
  data: { active: string }
}>()

</script>

<style lang="scss" scoped>

</style>
