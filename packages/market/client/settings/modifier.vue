<template>
  <div class="modifier">
    <h2 class="k-schema-header">过滤器设置</h2>
    <k-filter v-model="filter"></k-filter>
  </div>
</template>

<script lang="ts" setup>

import { computed } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const filter = computed({
  get: () => props.modelValue.$filter,
  set: value => emit('update:modelValue', {
    ...props.modelValue,
    $filter: value,
  }),
})

</script>

<style lang="scss">

.modifier {
  margin-bottom: 2rem;

  .k-schema-header {
    font-size: 1.25rem;
  }
}

</style>
