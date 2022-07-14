<template>
  <nav class="layout-navbar">
    <div class="top">
      <navbar-item v-for="route in getRoutes('top')" :key="route.name" :route="route"></navbar-item>
    </div>
    <div class="bottom">
      <div class="navbar-item" @click="toggle">
        <k-icon class="menu-icon" :name="'activity:' + (isDark ? 'moon' : 'sun')"></k-icon>
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

<style lang="scss">

nav.layout-navbar {
  position: fixed;
  box-sizing: border-box;
  z-index: 100;
  top: var(--header-height);
  bottom: var(--footer-height);
  width: var(--navbar-width);
  background-color: var(--card-bg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: var(--border) 1px solid;
  transition: var(--color-transition);
}

</style>
