<template>
  <nav class="layout-activity">
    <activity-item v-for="data in groups.top" placement="right" :key="data.id" :data="data"></activity-item>
    <activity-group v-if="groups.hidden">
      <activity-item v-for="data in groups.hidden" placement="bottom" :key="data.id" :data="data"></activity-item>
    </activity-group>
    <div v-else class="spacer"></div>
    <activity-item v-for="data in groups.bottom" placement="right" :key="data.id" :data="data"></activity-item>
  </nav>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { activities, Activity } from '@koishijs/client'
import ActivityItem from './activity-item.vue'
import ActivityGroup from './activity-group.vue'

const { height, width } = useWindowSize()

const groups = computed(() => {
  let hidden: Activity[]
  const unit = width.value <= 768 ? 56 : 64
  const list = Object.values(activities)
    .filter(data => data.position)
    .sort((a, b) => a.order - b.order)
  if (list.length * unit > height.value) {
    hidden = list
      .splice(0, list.length + 1 - Math.floor(height.value / unit))
      .sort((a, b) => {
        const scale = a.position === 'top' ? -1 : 1
        if (a.position === b.position) {
          return scale * (a.order - b.order)
        }
        return scale
      })
  }
  const top = list.filter(data => data.position === 'top').reverse()
  const bottom = list.filter(data => data.position === 'bottom')
  return { top, bottom, hidden }
})

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
  justify-content: space-evenly;
  border-right: var(--border) 1px solid;
  transition: var(--color-transition);

  .spacer {
    flex: 1 0 auto;
  }
}

</style>
