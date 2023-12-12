<template>
  <k-layout main="page-deps" menu="dependencies">
    <table class="table-head">
      <colgroup>
        <col width="auto">
        <col width="15%">
        <col width="30%">
        <col width="15%">
      </colgroup>
      <thead>
        <tr>
          <th>依赖名称</th>
          <th>本地版本</th>
          <th>目标版本</th>
          <th>操作</th>
        </tr>
      </thead>
    </table>
    <el-scrollbar class="body-container">
      <table class="table-body">
        <colgroup>
          <col width="auto">
          <col width="15%">
          <col width="30%">
          <col width="15%">
        </colgroup>
        <tbody>
          <package-view v-for="name in names" :key="name" :name="name"></package-view>
        </tbody>
      </table>
    </el-scrollbar>
  </k-layout>
  <manual-install/>
</template>

<script lang="ts" setup>

import { computed, watch, WatchStopHandle } from 'vue'
import { store, useContext, mapValues } from '@koishijs/client'
import { config, hasUpdate } from '../utils'
import { manualDeps } from './utils'
import ManualInstall from './manual.vue'
import PackageView from './package.vue'

const names = computed(() => {
  return Object
    .keys({
      ...store.dependencies,
      ...config.value.override,
    })
    .filter(name => !store.dependencies[name]?.workspace)
    .sort((a, b) => a > b ? 1 : -1)
})

let dispose: WatchStopHandle
watch(() => store.market?.registry, (registry) => {
  dispose?.()
  if (!registry) return
  dispose = watch(() => config.value.override, (object) => {
    Object.keys(object).forEach(async (name) => {
      if (store.dependencies[name]) return
      const response = await fetch(`${registry}/${name}`)
      const data = await response.json()
      manualDeps[name] = mapValues(data.versions, () => ({ peers: {}, result: 'success' }))
    })
  }, { immediate: true })
}, { immediate: true })

const updates = computed(() => names.value.filter(hasUpdate))

const ctx = useContext()

ctx.action('dependencies.upgrade', {
  disabled: () => !updates.value.length,
  async action() {
    for (const name of updates.value) {
      const versions = store.registry[name]
      config.value.override[name] = Object.keys(versions)[0]
    }
  },
})

</script>

<style lang="scss">

.page-deps {
  display: flex;
  flex-flow: column;

  .body-container {
    transform: translateY(1px);
    margin-top: -1px;
  }

  table {
    tr:first-child {
      border-top: none;
    }
  }

  tbody {
    tr {
      transition: 0.3s ease;
    }

    tr:hover {
      background-color: var(--k-side-bg);
    }
  }

  @media (max-width: 768px) {
    td {
      padding: 0.5em 0.5em;
    }
  }
}

</style>
