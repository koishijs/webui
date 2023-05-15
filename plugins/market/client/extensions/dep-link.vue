<template>
  <span class="link" @click.stop="active = name">
    {{ name }}
  </span>
  <span v-if="store.packages[name]?.runtime?.id"> (已加载)</span>
  <span v-else> (点击{{ name in store.packages ? '配置' : '添加' }})</span>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import {} from '@koishijs/plugin-config'
import { active } from '../utils'

defineProps<{
  name: string
}>()

</script>

<style scoped lang="scss">

.link {
  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
}

</style>
