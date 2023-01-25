<template>
  <g class="link">
    <line
      :x1="link.source.x"
      :y1="link.source.y"
      :x2="link.target.x"
      :y2="link.target.y"
      class="shadow"
      @mouseenter.stop.prevent="$emit('mouseenter', link, $event)"
      @mouseleave.stop.prevent="$emit('mouseleave', link, $event)"
    />
    <line
      :x1="link.source.x"
      :y1="link.source.y"
      :x2="link.target.x"
      :y2="link.target.y"
      :class="link.type"
    />
    <line
      :x1="arrow.x0"
      :y1="arrow.y0"
      :x2="arrow.x1"
      :y2="arrow.y1"
    />
    <line
      :x1="arrow.x0"
      :y1="arrow.y0"
      :x2="arrow.x2"
      :y2="arrow.y2"
    />
  </g>
</template>

<script lang="ts" setup>

import { Link, constants } from './utils'
import { computed } from 'vue'

const props = defineProps<{
  link: Link
}>()

defineEmits(['mouseenter', 'mouseleave'])

const arrow = computed(() => {
  const { source, target } = props.link
  const dx = target.x - source.x
  const dy = target.y - source.y
  const theta = Math.atan2(dy, dx)
  const x0 = target.x - constants.arrowOffset * Math.cos(theta)
  const y0 = target.y - constants.arrowOffset * Math.sin(theta)
  const x1 = x0 - constants.arrowLength * Math.cos(theta - constants.arrowAngle)
  const y1 = y0 - constants.arrowLength * Math.sin(theta - constants.arrowAngle)
  const x2 = x0 - constants.arrowLength * Math.cos(theta + constants.arrowAngle)
  const y2 = y0 - constants.arrowLength * Math.sin(theta + constants.arrowAngle)
  return { x0, y0, x1, y1, x2, y2 }
})

</script>

<style lang="scss" scoped>


g.link {
  line {
    transition: 0.3s ease;
    &:hover {
      stroke-width: 5;
    }
    &.dashed {
      stroke-dasharray: 6 6;
    }
    &.shadow {
      stroke: transparent;
      stroke-width: 6;
      cursor: pointer;
    }
    &:not(.shadow) {
      stroke: var(--fg3);
      stroke-opacity: 0.3;
      stroke-width: 3;
      pointer-events: none;
    }
  }

  .has-highlight &:not(.highlight) line:not(.shadow) {
    stroke-opacity: 0.1;
  }
}

</style>
