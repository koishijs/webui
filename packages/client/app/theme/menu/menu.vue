<template>
  <div ref="menu" class="k-menu">
    <template v-for="item of ctx.internal.menus[id]">
      <div class="k-menu-separator" v-if="item.id === '@separator'"></div>
      <menu-item v-else v-bind="{ prefix: id, ...item }"></menu-item>
    </template>
  </div>
</template>

<script lang="ts" setup>

import { useContext } from '@koishijs/client'
import MenuItem from './menu-item.vue'

defineProps<{
  id: string
}>()

const ctx = useContext()

</script>
