<template>
  <k-schema
    v-if="inner"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :schema="{ ...inner, meta: { ...inner.meta, ...schema.meta } }"
    :initial="initial"
    :disabled="disabled"
    :prefix="prefix"
  >
    <template #title><slot name="title"></slot></template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix><slot name="suffix"></slot></template>
  </k-schema>

  <schema-base
    v-else
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :schema="schema"
    :initial="initial"
    :disabled="disabled"
    :prefix="prefix"
  >
    <template #title><slot name="title"></slot></template>
    <template #desc><slot name="desc"></slot></template>
    <template #menu><slot name="menu"></slot></template>
  </schema-base>
</template>

<script setup lang="ts">

import { computed, PropType } from 'vue'
import { store } from '../data'
import { Schema, SchemaBase } from '@koishijs/components'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<any>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<any>,
  extra: {} as PropType<any>,
})

defineEmits(['update:modelValue'])

const inner = computed(() => {
  const hydrated = store.schema?.[props.schema?.meta.extra?.name]
  return hydrated && new Schema(hydrated)
})

</script>

