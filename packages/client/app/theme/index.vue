<template>
  <activity-bar></activity-bar>
  <router-view v-if="loaded" #="{ Component }">
    <keep-alive>
      <component :is="Component"></component>
    </keep-alive>
  </router-view>
  <div class="loading" v-else v-loading="true" element-loading-text="正在加载数据……"></div>
  <status-bar></status-bar>
  <menu-list></menu-list>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ActivityBar from './activity/index.vue'
import StatusBar from './status.vue'
import MenuList from './menu/index.vue'

const route = useRoute()

const loaded = computed(() => {
  if (!route.meta.activity?.fields) return true
  return route.meta.activity.fields.every((key) => store[key])
})

</script>
