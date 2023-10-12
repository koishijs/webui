<template>
  <div
    class="k-menu-item"
    v-if="forced || !disabled"
    :class="[type, { disabled }]"
    @click.prevent="item?.action(ctx.internal.createScope())"
  >
    <span v-if="icon" class="k-menu-icon"><k-icon :name="icon"/></span>
    {{ toValue(label) }}
  </div>
</template>

<script lang="ts" setup>

import { MaybeGetter, MenuItem, useContext } from '@koishijs/client'
import { computed } from 'vue'

const props = defineProps<MenuItem & { prefix: string }>()

const ctx = useContext()

const forced = computed(() => props.id.startsWith('!'))

const item = computed(() => {
  let id = props.id.replace(/^!/, '')
  if (id.startsWith('.')) id = props.prefix + id
  return ctx.internal.actions[id]
})

const disabled = computed(() => {
  if (!item.value) return true
  if (!item.value.disabled) return false
  return toValue(item.value.disabled)
})

const icon = computed(() => toValue(props.icon))

function toValue<T>(getter: MaybeGetter<T>): T {
  if (typeof getter !== 'function') return getter
  return (getter as any)(ctx.internal.createScope())
}

</script>
