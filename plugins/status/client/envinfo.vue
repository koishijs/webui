<template>
  <k-status v-if="store.envinfo" class="version" @click="copyInfo">
    Koishi v{{ store.envinfo.koishi.Core }}
    <template #tooltip>
      <div class="section" v-for="(data, key) in store.envinfo">
        <p class="title">{{ capitalize(key) }}:</p>
        <p class="info" v-for="(value, key) in data" :key="key">
          {{ key }}: {{ value }}
        </p>
      </div>
    </template>
  </k-status>
</template>

<script lang="ts" setup>

import { capitalize, message, store } from '@koishijs/client'
import { copyToClipboard } from './utils'

async function copyInfo() {
  const text = Object.entries(store.envinfo).map(([key, data]) => {
    return `${capitalize(key)}:\n` + Object.entries(data).map(([key, value]) => `    ${key}: ${value}`).join('\n')
  }).join('\n\n')
  await copyToClipboard(text)
  message.success('已复制环境信息！')
}

</script>

<style lang="scss" scoped>

p {
  margin: 8px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 1;
}

.info {
  padding-left: 20px;
}

</style>
