<template>
  <k-comment v-if="!validate(resolved)" type="warning">
    <p>部分配置项无法正常显示，这可能并非预期行为<slot name="hint"></slot>。</p>
  </k-comment>

  <form class="k-form">
    <slot name="prolog"></slot>
    <h2 class="k-schema-header" v-if="showHeader ?? !hasTitle(resolved, true)">基础设置</h2>
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
import { hasTitle, Schema, validate } from 'schemastery-vue'

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

const emit = defineEmits(['update:modelValue'])

const config = computed({
  get: () => props.modelValue,
  set: emit.bind(null, 'update:modelValue'),
})

</script>

<style lang="scss">

.k-form {
  margin-bottom: 2rem;
}

</style>
