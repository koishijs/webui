<template>
  <template v-for="menu of ctx.internal.activeMenus" :key="menu.id">
    <k-menu v-bind="menu"></k-menu>
  </template>
</template>

<script lang="ts" setup>

import { useContext } from '@koishijs/client'
import { useEventListener } from '@vueuse/core'
import KMenu from './menu.vue'

const ctx = useContext()

useEventListener('click', () => {
  ctx.internal.activeMenus.splice(0)
})

useEventListener('contextmenu', () => {
  ctx.internal.activeMenus.splice(0)
})

</script>
