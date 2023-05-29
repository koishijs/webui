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

<style lang="scss">

.k-menu {
  position: fixed;
  z-index: 1000;
  min-width: 12rem;
  padding: var(--k-menu-padding-vertical) 0;
  border-radius: 6px;
  background-color: var(--k-menu-bg);
  box-shadow: var(--k-menu-shadow);
  transition: var(--color-transition);
  font-size: 14px;

  .k-menu-separator {
    margin: var(--k-menu-padding-vertical) 0;
    border-top: 1px solid var(--k-color-border);

    &:first-child, &:last-child {
      display: none;
    }

    & + & {
      display: none;
    }
  }
}

</style>
