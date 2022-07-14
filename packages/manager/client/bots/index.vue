<template>
  <k-layout>
    <template #left v-if="botCount || current === ''">
      <el-scrollbar>
        <bot-preview
          v-for="(bot, key) in store.bots" :key="key" :data="bot"
          :class="{ active: current === key }" @click="current = key.toString()"/>
      </el-scrollbar>
    </template>
    <!-- <template v-if="current === null">
      <k-empty v-if="botCount">
        <div>当前未选择机器人</div>
      </k-empty>
      <k-empty v-else>
        <div>当前没有配置任何机器人</div>
        <k-button solid @click="current = ''">添加机器人</k-button>
      </k-empty>
    </template> -->
    <k-content class="bot-profile">
      <p>
        目前暂无信息。请前往「插件配置」页面调整配置。
      </p>
      <!-- <bot-settings :current="current" :key="current"></bot-settings> -->
    </k-content>
  </k-layout>
</template>

<script setup lang="ts">

import { ref, computed, watch } from 'vue'
import { store } from '@koishijs/client'
import BotPreview from './preview.vue'
import BotSettings from './settings.vue'

const current = ref<string>(null)
const botCount = computed(() => Object.keys(store.bots).length)

watch(() => store.bots, () => {
  if (current.value && !store.bots[current.value]) {
    current.value = null
  }
})

</script>

<style lang="scss">

</style>
