<template>
  <k-comment
    v-for="({ required, active }, name) in env.peer" :key="name"
    :type="active ? 'success' : required ? 'warning' : 'primary'">
    <p>
      {{ required ? '必需' : '可选' }}依赖：<k-dep-link :name="name"></k-dep-link>
    </p>
  </k-comment>
  <k-comment
    v-for="({ required }, name) in env.using" :key="name"
    :type="name in store.services ? 'success' : required ? 'warning' : 'primary'">
    <p>
      {{ required ? '必需' : '可选' }}服务：{{ name }}
      <span v-if="name in store.services">(已加载)</span>
      <span v-else-if="available[name].length">(未加载，启用下列任一插件可实现此服务)</span>
      <span v-else>(未加载)</span>
    </p>
    <ul v-if="!(name in store.services) && available[name].length">
      <li v-for="shortname in available[name]">
        <k-dep-link :name="shortname"></k-dep-link>
      </li>
    </ul>
  </k-comment>
</template>

<script lang="ts" setup>

import { Dict, store } from '@koishijs/client'
import { computed, inject, ComputedRef } from 'vue'
import { EnvInfo } from '@koishijs/plugin-config/client'
import KDepLink from './dep-link.vue'

const env = inject<ComputedRef<EnvInfo>>('plugin:env')

const getImplements = (name: string) => ({
  ...store.market.data?.[name],
  ...store.packages[name],
}.manifest?.service.implements ?? [])

const getAvailable = (name: string) => Object
  .values(store.market.data ?? {})
  .filter(data => getImplements(data.package.name).includes(name))
  .map(data => data.package.name)

const available = computed(() => {
  const available: Dict<string[]> = {}
  for (const name in env.value.using) {
    available[name] = getAvailable(name)
  }
  return available
})

</script>

