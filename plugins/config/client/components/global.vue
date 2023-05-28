<template>
  <k-form :schema="store.packages[''].runtime.schema" :initial="current.config" v-model="config"></k-form>
</template>

<script lang="ts" setup>

import { send, store, useAction } from '@koishijs/client'
import { computed } from 'vue'
import { Tree } from './utils'

const props = defineProps<{
  current: Tree
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const config = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

useAction('config.save', {
  action: () => send('manager/app-reload', config.value),
})

</script>
