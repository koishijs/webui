<template>
  <div
    class="separator"
    :class="{ 'drag-over': hasDragOver }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragover.prevent
  ></div>
</template>

<script lang="ts" setup>

import { ComputedRef, ref, inject } from 'vue'
import { Activity, useConfig, useContext } from '@koishijs/client'

type Position = 'top' | 'bottom'

const props = defineProps<{
  index: number
  position: Position
}>()

const groups = inject('groups') as ComputedRef<Record<Position, Activity[][]>>

const hasDragOver = ref(false)

function handleDragEnter(event: DragEvent) {
  hasDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  hasDragOver.value = false
}

const config = useConfig()
const ctx = useContext()

function handleDrop(event: DragEvent) {
  hasDragOver.value = false
  const text = event.dataTransfer.getData('text/plain')
  if (!text.startsWith('activity:')) return
  const id = text.slice(9)
  const list = groups.value[props.position].map(([item]) => item)
  const oldIndex = list.findIndex(item => item.id === id)
  if (oldIndex === props.index || oldIndex === props.index - 1 && oldIndex !== -1) return
  event.preventDefault()

  let index = props.index
  const item = ctx.$router.pages[id]
  if (oldIndex < 0) {
    list.splice(index, 0, item)
  } else {
    if (oldIndex < index) index--
    list.splice(oldIndex, 1)
    list.splice(index, 0, item)
  }

  const override = (config.value.activities ??= {})[id] ??= {}
  delete override.parent
  if (item.options.position !== props.position) {
    override.position = props.position
  } else {
    delete override.position
  }

  const anchorL = list.findLastIndex((item, i) => i < index && item.order === item.options.order)
  const anchorR = list.findIndex((item, i) => i > index && item.order === item.options.order)
  if (anchorL === -1) {
    if (anchorR === -1) {
      delete override.order
    } else {
      let order = list[anchorR].options.order
      for (let index = anchorR - 1; index >= 0; index--) {
        const override = config.value.activities[list[index].id] ??= {}
        override.order = order += 100
      }
    }
  } else {
    if (anchorR === -1) {
      let order = list[anchorL].options.order
      for (let index = anchorL + 1; index < list.length; index++) {
        const override = config.value.activities[list[index].id] ??= {}
        override.order = order -= 100
      }
    } else {
      let orderL = list[anchorL].options.order
      let orderR = list[anchorR].options.order
      for (let index = anchorL + 1; index < anchorR; index++) {
        const override = config.value.activities[list[index].id] ??= {}
        override.order = orderL + (orderR - orderL) * (index - anchorL) / (anchorR - anchorL)
      }
    }
  }

  if (!Object.keys(override).length) {
    delete config.value.activities[id]
  }
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
