<template>
  <div
    class="separator"
    :class="{ 'drag-over': hasDragOver }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop.prevent.stop="handleDragLeave($event), $emit('drop', $event)"
  ></div>
</template>

<script lang="ts" setup>

import { ref } from 'vue'

defineEmits(['drop'])

const hasDragOver = ref(false)

function handleDragEnter(event: DragEvent) {
  hasDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  hasDragOver.value = false
}

</script>

<style lang="scss" scoped>

.separator {
  position: relative;
  height: var(--activity-padding);

  &::before {
    position: absolute;
    content: '';
    top: 50%;
    left: var(--activity-padding);
    right: var(--activity-padding);
    height: 2px;
    border-radius: 2px;
    transform: translateY(-50%);
    transition: var(--color-transition);
    background-color: transparent;
  }

  &.drag-over::before {
    background-color: var(--k-text-active);
  }
}

</style>
