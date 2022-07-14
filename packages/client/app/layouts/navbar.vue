<template>
  <nav class="navbar">
    <div class="top">
      <navbar-item v-for="route in getRoutes('top')" :key="route.name" :route="route"></navbar-item>
    </div>
    <div class="bottom">
      <div class="navbar-item" @click="toggle">
        <k-icon class="menu-icon" :name="isDark ? 'moon' : 'sun'"></k-icon>
      </div>
      <navbar-item v-for="route in getRoutes('bottom')" :key="route.name" :route="route"></navbar-item>
    </div>
  </nav>
</template>

<script lang="ts" setup>

import { routes, getValue } from '@koishijs/client'
import { useDark } from '@vueuse/core'
import NavbarItem from './navbar-item.vue'

function getRoutes(position: 'top' | 'bottom') {
  const scale = position === 'top' ? 1 : -1
  return routes.value
    .filter(r => getValue(r.meta.position) === position)
    .sort((a, b) => scale * (b.meta.order - a.meta.order))
}

const isDark = useDark()

function toggle() {
  isDark.value = !isDark.value
}

</script>

<style lang="scss" scoped>

nav.navbar {
  position: fixed;
  z-index: 100;
  top: var(--navbar-size);
  bottom: 0;
  width: var(--navbar-size);
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: var(--color-transition);
}

</style>
