<template>
  <el-tooltip :placement="placement" popper-class="activity-item-tooltip">
    <template #content>
      <div class="title">{{ data.name }}</div>
      <div class="desc" v-if="data.desc">{{ data.desc }}</div>
    </template>
    <router-link class="navbar-item" :to="target">
      <k-icon class="menu-icon" :name="data.icon"></k-icon>
    </router-link>
  </el-tooltip>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { Activity } from '@koishijs/client'
import { Placement } from 'element-plus'
import { routeCache } from './utils'

const props = defineProps<{
  data: Activity,
  placement: Placement,
}>()

const target = computed(() => {
  return routeCache[props.data.id] || props.data.path.replace(/:.+/, '')
})

</script>

<style lang="scss">

.navbar-item {
  height: var(--activity-width);
  width: var(--activity-width);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: var(--color-transition);
  color: var(--k-text-light);
  cursor: pointer;

  .menu-icon {
    height: var(--activity-icon-size);
  }

  &:hover {
    color: var(--k-text-dark);
  }

  &.active {
    color: var(--k-text-active);
  }

  $marker-width: 4px;

  .layout-activity &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: $marker-width;
    height: 2rem;
    transform: translateX(-100%) translateY(-50%);
    display: block;
    border-radius: 0 $marker-width $marker-width 0;
    background-color: var(--k-text-active);
    transition: all 0.3s ease;
  }

  .layout-activity &.active::before {
    transform: translateY(-50%);
  }

  .badge {
    position: absolute;
    border-radius: 1rem;
    color: #ffffff;
    background-color: var(--k-color-danger);
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

.activity-item-tooltip {
  padding: 6px 11px;
  line-height: 1.6;

  .title {
    font-size: 13px;
    font-weight: 500;
  }

  .desc {
    font-size: 12px;
  }
}

</style>
