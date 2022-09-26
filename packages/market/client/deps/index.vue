<template>
  <k-layout main="page-deps" :menu="menu">
    <div class="controls">
      <el-checkbox v-model="config.hideWorkspace">忽略工作区依赖</el-checkbox>
    </div>
    <table>
      <colgroup>
        <col width="auto">
        <col width="15%">
        <col width="15%">
        <col width="15%">
        <col width="15%">
      </colgroup>
      <thead>
        <tr>
          <th>依赖名称</th>
          <th>本地版本</th>
          <th>目标版本</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
    </table>
    <el-scrollbar class="body-container">
      <table class="table-body">
        <colgroup>
          <col width="auto">
          <col width="15%">
          <col width="15%">
          <col width="15%">
          <col width="15%">
        </colgroup>
        <tbody>
          <package-view v-for="name in names" :key="name" :name="name"></package-view>
        </tbody>
      </table>
    </el-scrollbar>
  </k-layout>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { store } from '@koishijs/client'
import { config, menu } from '../utils'
import PackageView from './package.vue'

const names = computed(() => {
  let data = Object.keys(store.dependencies)
  if (config.hideWorkspace) {
    data = data.filter(name => !store.dependencies[name].workspace)
  }
  return data.sort((a, b) => a > b ? 1 : -1)
})

</script>

<style lang="scss">

.page-deps {
  display: flex;
  flex-flow: column;

  .controls {
    height: 2rem;
    padding: 0 2rem;
    line-height: 2rem;
    margin: 1rem 0;
  }

  .body-container {
    transform: translateY(1px);
    margin-top: -1px;
  }

  tbody {
    tr {
      transition: 0.3s ease;
    }

    tr:hover {
      background-color: var(--hover-bg);
    }

    tr:first-child {
      border-top: none;
    }
  }
}

</style>
