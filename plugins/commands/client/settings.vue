<template>
  <k-comment type="success" v-if="list.length">
    <p>此插件提供了下列指令：</p>
    <ul>
      <li v-for="item in list" :key="item.name">
        <router-link :to="'/commands/' + item.name.replace(/\./g, '/')">{{ item.name }}</router-link>
      </li>
    </ul>
  </k-comment>
</template>

<script lang="ts" setup>

import { computed, inject } from 'vue'
import { CommandData } from '../lib'
import { useRpc } from '@koishijs/client'

const current: any = inject('manager.settings.current')

const data = useRpc<CommandData[]>()

const list = computed(() => {
  return getCommands(data.value)
    .filter(item => item.paths.includes(current.value.path))
    .sort((a, b) => a.name.localeCompare(b.name))
})

function getCommands(data: CommandData[]) {
  const result: CommandData[] = []
  for (const item of data) {
    result.push(item)
    if (!item.children) continue
    result.push(...getCommands(item.children))
  }
  return result
}

</script>

<style lang="scss" scoped>

</style>
