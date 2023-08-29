<template>
  <k-layout class="page-database">
    <template #header>
      数据库
      <span v-if="store.database?.size">({{ formatSize(store.database.size) }})</span>
    </template>

    <template #menu>
      <span class="menu-item" @click="filter = !filter">
        <k-icon class="menu-icon" :name="filterIcon"></k-icon>
      </span>
      <span class="menu-item" @click="table?.updateData()">
        <k-icon class="menu-icon" name="refresh"></k-icon>
      </span>
    </template>

    <template #left>
      <el-scrollbar>
        <k-tab-group :data="store.database.tables" v-model="current"></k-tab-group>
      </el-scrollbar>
    </template>

    <keep-alive>
      <k-empty v-if="!current">
        <div>在左侧选择要访问的数据表</div>
      </k-empty>
      <table-view v-else :key="current" :name="current" :filter="filter" ref="table"></table-view>
    </keep-alive>
  </k-layout>
</template>

<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { router, store } from '@koishijs/client'
import { formatSize } from './utils'
import TableView from './components/data-table.vue'

function join(source: string | string[]) {
  return Array.isArray(source) ? source.join('/') : source || ''
}

const table = ref()

const filter = ref(false)
const filterIcon = computed(() => filter.value ? 'filter-off' : 'filter-on')

const route = useRoute()

const current = computed<string>({
  get() {
    const name = join(route.params.name)
    return store.database.tables[name] ? name : ''
  },
  set(name) {
    if (!store.database.tables[name]) name = ''
    router.replace('/database/' + name)
  },
})

</script>

<style lang="scss">

.page-database aside .el-scrollbar__view {
  padding: 1rem 0;
  line-height: 2.25rem;
}

</style>
