<template>
  <el-tooltip :placement="placement" popper-class="activity-item-tooltip">
    <template #content>
      <div class="title">{{ data.name }}</div>
      <div class="desc" v-if="data.desc">{{ data.desc }}</div>
    </template>
    <router-link v-if="data.path" class="navbar-item" :to="target">
      <k-icon class="menu-icon" :name="data.icon"></k-icon>
    </router-link>
    <div v-else class="navbar-item" @click.stop="data.action">
      <k-icon class="menu-icon" :name="data.icon"></k-icon>
    </div>
  </el-tooltip>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { Activity, routeCache } from '../utils'
import { Placement } from 'element-plus'

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
  cursor: pointer;

  .menu-icon {
    height: var(--activity-icon-size);
  }

  $marker-width: 4px;

  &.active {
    color: var(--active);
  }

  .layout-activity &.active::before {
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
