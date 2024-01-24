<template>
  <div v-if="active && active.startsWith('commands.') && data" class="navigation flex flex-wrap gap-x-4 gap-y-2 my-8">
    <router-link
      class="el-button"
      :to="'/commands/' + active.slice(9).replace(/\./, '/')"
    >前往指令</router-link>
  </div>
</template>

<script lang="ts" setup>

import { useRpc } from '@koishijs/client'
import { inject, ComputedRef } from 'vue'
import { CommandData } from '../lib';

const active = inject<ComputedRef<string>>('locale:prefix')

const data = useRpc<CommandData[]>()

</script>

<style lang="scss" scoped>

</style>
