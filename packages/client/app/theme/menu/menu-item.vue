<template>
  <div
    class="k-menu-item"
    v-if="forced || !disabled"
    :class="{ disabled }"
    @click.prevent="action?.action(ctx.internal.createScope())"
  >
    {{ toValue(label) }}
  </div>
</template>

<script lang="ts" setup>

import { MaybeGetter, MenuItem, useContext } from '@koishijs/client'
import { computed } from 'vue'

const props = defineProps<MenuItem & { prefix: string }>()

const ctx = useContext()

const forced = computed(() => props.id.startsWith('!'))

const action = computed(() => {
  let id = props.id.replace(/^!/, '')
  if (id.startsWith('.')) id = props.prefix + id
  return ctx.internal.actions[id]
})

const disabled = computed(() => {
  if (!action.value) return true
  if (!action.value.disabled) return false
  return toValue(action.value.disabled)
})

function toValue<T>(getter: MaybeGetter<T>): T {
  if (typeof getter !== 'function') return getter
  return (getter as any)(ctx.internal.createScope())
}

</script>
