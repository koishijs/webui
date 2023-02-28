<template>
  <template v-for="data in commands" :key="data.name">
    <div v-if="data.paths.includes(current.path)">
      <h2 class="k-schema-header">指令：{{ data.name }}</h2>
      <k-form :schema="commandSchema" :show-header="false"></k-form>
    </div>
  </template>
</template>

<script lang="ts" setup>

import { inject, computed, ref } from 'vue'
import {} from 'koishi-plugin-gocqhttp'
import { store, send, Schema } from '@koishijs/client'
import { CommandData } from '@koishijs/plugin-commands'

const local: any = inject('manager.settings.local')
const config: any = inject('manager.settings.config')
const current: any = inject('manager.settings.current')

const commandSchema = computed(() => {
  return new Schema(store.schema['command'])
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

const commands = computed(() => {
  if (!store.commands) return []
  return getCommands(store.commands)
})

</script>

<style lang="scss" scoped>

</style>
