<template>
  <nav class="layout-activity">
    <div class="top">
      <activity-item v-for="route in getRoutes('top')" :key="route.name" :route="route"></activity-item>
    </div>
    <div class="bottom">
      <div class="navbar-item" @click="toggle">
        <k-icon class="menu-icon" :name="'activity:' + (isDark ? 'moon' : 'sun')"></k-icon>
      </div>
      <activity-item v-for="route in getRoutes('bottom')" :key="route.name" :route="route"></activity-item>
    </div>
  </nav>
</template>

<script lang="ts" setup>

import { routes, getValue, store } from '@koishijs/client'
import { useDark } from '@vueuse/core'
import ActivityItem from './activity-item.vue'

function getRoutes(position: 'top' | 'bottom') {
  const scale = position === 'top' ? 1 : -1
  return routes.value
    .filter((route) => {
      const { fields = [] } = route.meta
      return fields.every(key => store[key]) && getValue(route.meta.position) === position
    })
    .sort((a, b) => scale * (b.meta.order - a.meta.order))
}

const isDark = useDark()

function toggle() {
  isDark.value = !isDark.value
}

</script>

<style lang="scss">

nav.layout-activity {
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
