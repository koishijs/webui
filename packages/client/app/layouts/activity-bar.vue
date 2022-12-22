<template>
  <nav class="layout-activity">
    <div class="top">
      <activity-item v-for="data in getActivities('top')" placement="right" :key="data.id" :data="data"></activity-item>
    </div>
    <activity-group>
      <activity-item v-for="data in getActivities('top')" placement="bottom" :key="data.id" :data="data"></activity-item>
    </activity-group>
    <div class="bottom">
      <activity-item v-for="data in getActivities('bottom')" placement="right" :key="data.id" :data="data"></activity-item>
    </div>
  </nav>
</template>

<script lang="ts" setup>

import { activities } from '@koishijs/client'
import ActivityItem from './activity-item.vue'
import ActivityGroup from './activity-group.vue'

function getActivities(position: 'top' | 'bottom') {
  const scale = position === 'top' ? 1 : -1
  return Object.values(activities)
    .filter(data => data.position === position)
    .sort((a, b) => scale * (b.order - a.order))
}

</script>

<style lang="scss" scoped>

.layout-activity {
  position: fixed;
  box-sizing: border-box;
  z-index: 100;
  top: 0;
  bottom: 0;
  width: var(--activity-width);
  background-color: var(--bg1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: var(--border) 1px solid;
  transition: var(--color-transition);
}

</style>
