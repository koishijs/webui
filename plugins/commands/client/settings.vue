<template>
  <k-comment type="success" v-if="data.length">
    <p>此插件提供了下列指令：</p>
    <ul>
      <li v-for="item in data" :key="item.name">
        <router-link :to="'/commands/' + item.name.replace(/\./g, '/')">{{ item.name }}</router-link>
      </li>
    </ul>
  </k-comment>
</template>

<script lang="ts" setup>

import { computed, inject } from 'vue'
import { commands } from './utils'

const current: any = inject('manager.settings.current')

const data = computed(() => {
  return Object
    .values(commands.value)
    .filter(item => item.paths.includes(current.value.path))
    .sort((a, b) => a.name.localeCompare(b.name))
})

</script>

<style lang="scss" scoped>

</style>
