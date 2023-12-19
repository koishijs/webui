<template>
  <el-tooltip v-if="!hidden" :disabled="disabled" :content="toValue(item.label)" placement="bottom">
    <span class="menu-item" :class="[toValue(item.type), { disabled }]" @click="trigger">
      <k-icon class="menu-icon" :name="toValue(item.icon)"></k-icon>
    </span>
  </el-tooltip>
</template>

<script lang="ts" setup>

import { LegacyMenuItem, MaybeGetter, useContext } from '@koishijs/client'
import { computed } from 'vue'

const props = defineProps<{
  item: any
  menuKey?: string
  menuData?: any
}>()

const ctx = useContext()

const hidden = computed(() => {
  if (!props.item.hidden) return false
  return toValue(props.item.hidden)
})

const disabled = computed(() => {
  if (!props.item.action) return true
  if (!props.item.disabled) return false
  return toValue(props.item.disabled)
})

function toValue<T>(getter: MaybeGetter<T>): T {
  if (typeof getter !== 'function') return getter
  return (getter as any)(ctx.internal.createScope())
}

function trigger() {
  return props.item.action(ctx.internal.createScope({
    [props.menuKey]: props.menuData,
  }))
}

</script>
