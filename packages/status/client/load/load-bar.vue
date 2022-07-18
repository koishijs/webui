<template>
  <div class="load-bar">
    <span class="title">{{ title }}</span>
    <span class="body">
      <span
        v-for="(type, index) in types"
        :key="type"
        :class="[type, 'bar']"
        :style="{ width: percentage(distribution[index]) }">
        <template v-if="index === maxIndex">{{ caption }}</template>
      </span>
    </span>
  </div>
</template>

<script lang="ts" setup>

import type { LoadRate } from '@koishijs/plugin-status/src'
import { computed } from 'vue'

const props = defineProps<{ rate: LoadRate, title: string }>()

function percentage(value: number, digits = 3) {
  return (value * 100).toFixed(digits) + '%'
}

const types = ['used', 'app', 'free'] as const

const distribution = computed(() => [
  props.rate[1] - props.rate[0],
  props.rate[0],
  1 - props.rate[1],
])

const maxIndex = computed(() => {
  return distribution.value.indexOf(Math.max(...distribution.value))
})

const caption = computed(() => {
  return `${percentage(props.rate[0], 1)} / ${percentage(props.rate[1], 1)}`
})

</script>

<style lang="scss" scoped>

.load-bar {
  display: flex;
  align-items: center;
  user-select: none;
  font-size: 0.9em;
  margin: 0.5rem 0;

  .title {
    min-width: 3em;
  }

  .body {
    width: 10rem;
    height: 0.8rem;
    font-size: 0.8em;
    position: relative;
    display: inline;
    background-color: var(--bg1);
    border-radius: 1rem;
    overflow: hidden;
    transition: var(--color-transition);
    color: var(--fg1);
  }

  .bar {
    height: 100%;
    position: relative;
    float: left;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .used {
    background-color: var(--primary);
    color: white;
    transition: color 0.3s ease, background-color 0.3s ease;
    &:hover {
      background-color: var(--primary-tint);
    }
  }

  .app {
    background-color: var(--warning);
    transition: color 0.3s ease, background-color 0.3s ease;
    &:hover {
      background-color: var(--warning-tint);
    }
  }
}

</style>