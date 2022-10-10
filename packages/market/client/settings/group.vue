<template>
  <div class="k-form" v-if="Object.keys(current.config.$filter || {}).length">
    <h2>过滤器</h2>
    <ul>
      <li v-for="(value, key) in current.config.$filter">
        {{ key }}: {{ value }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>

import { Schema, clone } from '@koishijs/client'
import { ref, watch } from 'vue'
import { Tree } from './utils'

const props = defineProps<{
  current: Tree
  modelValue: any
}>()

const config = ref()

watch(() => props.current.config, (value) => {
  config.value = clone(value)
}, { immediate: true })

const filter = Schema.object({
  user: Schema.array(String).description('用户列表'),
  channel: Schema.array(String).description('频道列表'),
  guild: Schema.array(String).description('群组列表'),
  platform: Schema.array(String).description('平台列表'),
}).description('过滤器')

</script>

<style lang="scss" scoped>

h2 {
  font-size: 1.25rem;
}

</style>
