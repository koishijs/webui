<template>
  <template v-for="{ id, styles } of ctx.internal.activeMenus" :key="id">
    <k-menu
      :id="id"
      :style="styles"
      :ref="el => elements[id] = (el as ComponentPublicInstance)"
    ></k-menu>
  </template>
</template>

<script lang="ts" setup>

import { Dict, useContext } from '@koishijs/client'
import { ComponentPublicInstance, shallowReactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import KMenu from './menu.vue'

const ctx = useContext()

const elements = shallowReactive<Dict<ComponentPublicInstance>>({})

useEventListener('click', () => {
  ctx.internal.activeMenus.splice(0)
})

useEventListener('contextmenu', () => {
  ctx.internal.activeMenus.splice(0)
})

</script>
