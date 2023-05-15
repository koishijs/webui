<template>
  <k-comment
    v-for="({ required, active }, name) in data.env.peer" :key="name"
    :type="active ? 'success' : required ? 'warning' : 'primary'">
    <p>
      {{ required ? '必需' : '可选' }}依赖：<k-dep-link :name="name"></k-dep-link>
    </p>
  </k-comment>
  <k-comment
    v-for="({ required }, service) in data.env.using" :key="service"
    :type="store.services[service] ? 'success' : required ? 'warning' : 'primary'">
    <p>
      {{ required ? '必需' : '可选' }}服务：{{ service }}
      <span v-if="store.services[service]">(已加载)</span>
      <span v-else-if="available[service].length">(未加载，启用下列任一插件可实现此服务)</span>
      <span v-else>(未加载)</span>
    </p>
    <ul v-if="!store.services[service] && available[service].length">
      <li v-for="name in available[service]">
        <k-dep-link :name="name"></k-dep-link>
      </li>
    </ul>
  </k-comment>
</template>

<script lang="ts" setup>

import { Dict, store } from '@koishijs/client'
import { computed } from 'vue'
import { SettingsData } from '@koishijs/plugin-config/client'
import KDepLink from './dep-link.vue'

const props = defineProps<{
  data: SettingsData
}>()

const getImplements = (name: string) => ({
  ...store.market.data?.[name],
  ...store.packages[name],
}.manifest?.service.implements ?? [])

const getAvailable = (name: string) => Object
  .values(store.market.data ?? {})
  .filter(data => getImplements(data.name).includes(name))
  .map(data => data.name)

const available = computed(() => {
  const available: Dict<string[]> = {}
  for (const name in props.data.env.using) {
    available[name] = getAvailable(name)
  }
  return available
})

</script>

