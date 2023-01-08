<template>
  <k-modifier v-model="config"></k-modifier>
</template>

<script lang="ts" setup>

import { clone } from '@koishijs/client'
import { ref, watch } from 'vue'
import { Tree } from './utils'
import KModifier from './modifier.vue'

const props = defineProps<{
  current: Tree
  modelValue: any
}>()

const config = ref()

watch(() => props.current.config, (value) => {
  config.value = clone(value)
}, { immediate: true })

</script>

<style lang="scss" scoped>

h2 {
  font-size: 1.25rem;
}

</style>
