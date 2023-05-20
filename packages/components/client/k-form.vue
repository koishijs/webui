<template>
  <form class="k-form">
    <slot name="prolog"></slot>
    <h2 class="k-schema-header" v-if="showHeader ?? !hasTitle(resolved)">
      <slot name="title">基础设置</slot>
    </h2>
    <k-schema
      v-model="config"
      :instant="instant"
      :initial="initial"
      :schema="resolved"
      :disabled="disabled"
    ></k-schema>
    <slot name="epilog"></slot>
  </form>
</template>

<script lang="ts" setup>

import { computed, PropType } from 'vue'
import { getChoices, Schema } from 'schemastery-vue'

const props = defineProps({
  schema: {} as PropType<Schema>,
  initial: {},
  modelValue: {},
  disabled: Boolean,
  showHeader: {},
  instant: Boolean,
})

const resolved = computed(() => {
  return props.schema && new Schema(props.schema)
})

function hasTitle(schema: Schema): boolean {
  if (!schema) return true
  if (schema.type === 'object') {
    if (schema.meta.description) return true
    const entries = Object.entries(schema.dict).filter(([, value]) => !value.meta.hidden)
    if (!entries.length) return true
    return hasTitle(schema.dict[entries[0][0]])
  } else if (schema.type === 'intersect') {
    return hasTitle(schema.list[0])
  } else if (schema.type === 'union') {
    const choices = getChoices(schema)
    return choices.length === 1 ? hasTitle(choices[0]) : false
  } else {
    return false
  }
}

const emit = defineEmits(['update:modelValue'])

const config = computed({
  get: () => props.modelValue,
  set: emit.bind(null, 'update:modelValue'),
})

</script>
