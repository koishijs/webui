<template>
  <div v-if="active && active.startsWith('commands.')" class="navigation flex flex-wrap gap-x-4 gap-y-2 my-8">
    <router-link
      class="el-button"
      :to="'/commands/' + active.slice(9).replace(/\./, '/')"
    >前往指令</router-link>
  </div>
</template>

<script lang="ts" setup>

import { inject, ComputedRef } from 'vue'

const active = inject<ComputedRef<string>>('locale:prefix')

</script>

<style lang="scss" scoped>

</style>
