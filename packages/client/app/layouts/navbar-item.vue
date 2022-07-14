<template>
  <el-tooltip :content="route.name" placement="right">
    <router-link class="navbar-item" :to="target">
      <k-icon class="menu-icon" :name="route.meta.icon || 'application'"></k-icon>
    </router-link>
    <span class="badge" v-if="badge">{{ badge }}</span>
  </el-tooltip>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { computed, PropType } from 'vue'
import { RouteRecordNormalized } from 'vue-router'
import { routeCache } from './utils'

const props = defineProps({
  route: {} as PropType<RouteRecordNormalized>,
})

const target = computed(() => {
  return routeCache[props.route.name] || props.route.path.replace(/:.+/, '')
})

const badge = computed(() => {
  if (!loaded.value) return 0
  return props.route.meta.badge.reduce((prev, curr) => prev + curr(), 0)
})

const loaded = computed(() => {
  if (!props.route.meta.fields) return true
  return props.route.meta.fields.every((key) => store[key])
})

</script>

<style lang="scss">

.navbar-item {
  height: var(--navbar-width);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: var(--color-transition);

  .menu-icon {
    height: var(--navbar-icon-size);
  }

  $marker-width: 4px;

  &.active {
    color: var(--active);
  }

  &.active::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: $marker-width;
    height: 2rem;
    transform: translateY(-50%);
    display: block;
    border-radius: 0 $marker-width $marker-width 0;
    background-color: var(--active);
    transition: var(--color-transition);
  }

  .badge {
    position: absolute;
    border-radius: 1rem;
    color: #ffffff;
    background-color: var(--error);
    top: 50%;
    right: 1.5rem;
    transform: translateY(-50%);
    line-height: 1;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: bolder;
    transition: var(--color-transition);
  }
}

</style>
