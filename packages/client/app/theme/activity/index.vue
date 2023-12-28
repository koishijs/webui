<template>
  <nav
    class="layout-activity flex flex-col justify-evenly"
    @contextmenu.stop="trigger($event, null)">
    <template v-for="(data, index) in groups.top" :key="data[0].id">
      <activity-separator position="top" :index="index" />
      <activity-item placement="right" :children="data"></activity-item>
    </template>
    <activity-separator position="top" :index="groups.top.length" />
    <activity-item v-if="groups.hidden" placement="bottom" :children="groups.hidden"></activity-item>
    <div v-else class="spacer"></div>
    <activity-separator position="bottom" :index="groups.top.length" />
    <template v-for="(data, index) in groups.bottom" :key="data.id">
      <activity-item placement="right" :children="data"></activity-item>
      <activity-separator position="bottom" :index="index" />
    </template>
  </nav>
</template>

<script lang="ts" setup>

import { computed, provide } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { activities, Activity, useConfig, useMenu } from '@koishijs/client'
import ActivityItem from './item.vue'
import ActivitySeparator from './separator.vue'

const config = useConfig()
const trigger = useMenu('theme.activity')
const { height, width } = useWindowSize()

const groups = computed(() => {
  let hidden: Activity[]
  const unit = width.value <= 768 ? 52 : 56
  const total = height.value - (width.value <= 768 ? 4 : 8)
  const available = Object.fromEntries(Object
    .entries(activities)
    .filter(([, data]) => !data.disabled())
    .map(([key, data]) => [key, [data]]))
  for (const id of Object.keys(available)) {
    const override = config.value.activities?.[id]
    if (!override) continue
    if (override.hidden) {
      delete available[id]
      continue
    }
    Object.assign(available[id][0], override)
    const parent = available[override.parent]
    if (parent) {
      parent.push(available[id][0])
      delete available[id]
    }
  }
  const list = Object.values(available).sort(([a], [b]) => a.order - b.order)
  if (list.length * unit > total) {
    hidden = list
      .splice(0, list.length + 1 - Math.floor(total / unit))
      .sort(([a], [b]) => {
        const scale = a.position === 'top' ? -1 : 1
        if (a.position === b.position) {
          return scale * (a.order - b.order)
        }
        return scale
      })
      .flat()
    hidden.unshift({ icon: 'activity:ellipsis' } as Activity)
  }
  const top = list.filter(([data]) => data.position !== 'bottom').reverse()
  const bottom = list.filter(([data]) => data.position === 'bottom')
  return { top, bottom, hidden }
})

provide('groups', groups)

</script>

<style lang="scss" scoped>

.marker {
  position: absolute;
}

.layout-activity {
  position: fixed;
  box-sizing: border-box;
  z-index: 100;
  top: 0;
  bottom: 0;
  width: var(--activity-width);
  background-color: var(--k-activity-bg);
  border-right: var(--k-activity-divider, var(--k-color-divider-dark)) 1px solid;
  transition: var(--color-transition);

  .spacer {
    flex: 1 0 auto;
  }
}

</style>
