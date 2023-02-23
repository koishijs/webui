<template>
  <div :class="{ 'is-left-aside-open': isLeftAsideOpen }">
    <activity-bar></activity-bar>
    <router-view v-if="loaded" #="{ Component }">
      <keep-alive>
        <component :is="Component"></component>
      </keep-alive>
    </router-view>
    <div class="loading" v-else v-loading="true" element-loading-text="正在加载数据……"></div>
    <status-bar></status-bar>
    <k-slot name="global"></k-slot>
  </div>
</template>

<script lang="ts" setup>

import { store } from './utils'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isLeftAsideOpen } from '@koishijs/client'
import ActivityBar from './activity/index.vue'
import StatusBar from './status-bar.vue'

const route = useRoute()

const loaded = computed(() => {
  if (!route.meta.activity?.fields) return true
  return route.meta.activity.fields.every((key) => store[key])
})

</script>
