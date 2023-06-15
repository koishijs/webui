<template>
  <div
    class="activity-item"
    :class="{ 'active': isActive, 'drag-over': hasDragOver }"
    @contextmenu.stop="trigger($event, children[0])"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragover.prevent>
    <el-tooltip placement="right" :popper-class="`activity-item-tooltip`">
      <template #content>
        <div class="activity-info">
          <div class="title">{{ children[hoverIndex].name }}</div>
          <div class="desc" v-if="children[hoverIndex].desc">{{ children[hoverIndex].desc }}</div>
        </div>
        <div class="activity-group" v-if="children.length > 1">
          <div class="activity-group-item" v-for="(child, index) in children.slice(1)" :key="child.id">
            <activity-button
              :data="child"
              @mouseenter="hoverIndex = index + 1"
              @mouseleave="hoverIndex = 0"
            ></activity-button>
          </div>
        </div>
      </template>
      <activity-button :data="children[0]"></activity-button>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Activity, useConfig, useMenu } from '@koishijs/client'
import { Placement } from 'element-plus'
import ActivityButton from './button.vue'
import { watch } from 'vue'

const route = useRoute()

const props = defineProps<{
  children: Activity[]
  placement: Placement
}>()

const isActive = computed(() => {
  return Object.values(props.children).some(child => route.meta?.activity?.id === child.id)
})

const hasDragOver = ref(false)

const trigger = useMenu('theme.activity')

const hoverIndex = ref(0)

watch(() => props.children, () => {
  hoverIndex.value = 0
})

function handleDragEnter(event: DragEvent) {
  hasDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  hasDragOver.value = false
}

const config = useConfig()

function handleDrop(event: DragEvent) {
  hasDragOver.value = false
  const text = event.dataTransfer.getData('text/plain')
  if (!text.startsWith('activity:')) return
  const id = text.slice(9)
  const target = props.children[0].id
  if (target === id || !target) return
  event.preventDefault()
  ;((config.value.activities ??= {})[id] ??= {}).parent = target
}

</script>

<style lang="scss">

.activity-item {
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

.activity-item-tooltip {
  padding: 0;

  .activity-info {
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

  .activity-group {
    display: flex;
    padding: var(--activity-padding);
    gap: 0 var(--activity-padding);
    border-top: 1px solid var(--k-color-divider);

    .activity-group-item {
      width: calc(var(--activity-width) - 2 * var(--activity-padding));
    }
  }
}

</style>
