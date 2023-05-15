<template>
  <k-form :schema="store.packages[''].schema" :initial="current.config" v-model="config"></k-form>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
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

</script>
