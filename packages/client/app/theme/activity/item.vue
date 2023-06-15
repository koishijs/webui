<template>
  <div
    class="navbar-item"
    :class="{ 'active': isActive, 'drag-over': hasDragOver }"
    @contextmenu.stop="trigger($event, data)"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop.stop.prevent>
    <el-tooltip :placement="placement" popper-class="activity-item-tooltip">
      <template #content>
        <div class="title">{{ data.name }}</div>
        <div class="desc" v-if="data.desc">{{ data.desc }}</div>
      </template>
      <router-link
        class="navbar-button"
        draggable="true"
        :to="target"
        :class="{ 'dragging': isDragging }"
        @dragend="handleDragEnd"
        @dragstart="handleDragStart">
        <k-icon class="menu-icon" :name="data.icon"></k-icon>
      </router-link>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Activity, useMenu } from '@koishijs/client'
import { Placement } from 'element-plus'
import { routeCache } from './utils'

const route = useRoute()

const props = defineProps<{
  data: Activity,
  placement: Placement,
}>()

const target = computed(() => {
  return routeCache[props.data.id] || props.data.path.replace(/:.+/, '')
})

const isActive = computed(() => route.meta?.activity?.id === props.data.id)

const isDragging = ref(false)
const hasDragOver = ref(false)

const trigger = useMenu('theme.activity')

function handleDragStart(event: DragEvent) {
  isDragging.value = true
}

function handleDragEnd(event: DragEvent) {
  isDragging.value = false
}

function handleDragEnter(event: DragEvent) {
  hasDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  hasDragOver.value = false
}

</script>

<style lang="scss">

.navbar-item {
  position: relative;
  box-sizing: border-box;
  width: var(--activity-width);
  padding: 0 var(--activity-padding);

  .layout-activity &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: var(--activity-marker-width);
    height: var(--activity-marker-height);
    transform: translateX(-100%) translateY(-50%);
    display: block;
    border-radius: 0 var(--activity-marker-width) var(--activity-marker-width) 0;
    background-color: var(--k-text-active);
    transition: all 0.3s ease;
  }

  .layout-activity &.active::before,
  .layout-activity &.drag-over::before {
    transform: translateY(-50%);
  }
}

.navbar-button {
  height: calc(var(--activity-width) - 2 * var(--activity-padding));
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: var(--color-transition);
  color: var(--k-text-light);
  border-radius: var(--activity-padding);
  cursor: pointer;

  .menu-icon {
    height: var(--activity-icon-size);
    pointer-events: none;
  }

  &:hover, &.dragging {
    color: var(--k-text-dark);
    background-color: var(--k-hover-bg);
  }

  &.active {
    color: var(--k-text-active);
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
