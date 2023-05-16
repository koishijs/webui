<template>
  <k-layout main="darker" class="page-market" :menu="menu">
    <template #left>
      <el-scrollbar>
        <market-filter v-model="words" :data="getSorted(data, words)"></market-filter>
      </el-scrollbar>
    </template>

    <div v-if="!store.market">
      <div class="el-loading-spinner">
        <svg class="circular" viewBox="25 25 50 50">
          <circle class="path" cx="50" cy="50" r="20" fill="none"></circle>
        </svg>
        <p class="el-loading-text">正在加载插件市场……</p>
      </div>
    </div>

    <el-scrollbar v-else-if="store.market.total">
      <market-list
        v-model="words"
        :data="data"
        :gravatar="store.market.gravatar">
        <template #header="{ hasFilter, all, packages }">
          <market-search v-model="words"></market-search>
          <div class="market-hint">
            共搜索到 {{ hasFilter ? packages.length + ' / ' : '' }}{{ all.length }} 个插件。
          </div>
        </template>
        <template #action="data">
          <k-button v-if="global.static" solid @click.stop="handleClick(data)">配置</k-button>
          <k-button v-else-if="installed(data)" type="success" solid @click.stop="handleClick(data)">修改</k-button>
          <k-button v-else solid @click.stop="handleClick(data)">添加</k-button>
        </template>
      </market-list>
    </el-scrollbar>

    <k-comment v-else type="error" class="market-error">
      <p>无法连接到插件市场。这可能是以下原因导致的：</p>
      <ul>
        <li>无法连接到网络，请检查你的网络连接和代理设置</li>
        <li>您所用的 registry 不支持搜索功能 (如 npmmirror)，请考虑进行更换</li>
      </ul>
    </k-comment>
  </k-layout>
</template>

<script setup lang="ts">

import { router, store, global } from '@koishijs/client'
import { computed, provide, ref, watch } from 'vue'
import { refresh, active } from '../utils'
import { getSorted, kConfig, MarketFilter, MarketList, MarketSearch } from '@koishijs/market'
import { AnalyzedPackage } from '@koishijs/registry'

function installed(data: AnalyzedPackage) {
  if (store.packages) {
    return !!store.packages[data.name]
  } else {
    return !!store.dependencies?.[data.name]
  }
}

provide(kConfig, { installed })

const words = ref<string[]>([''])

const prompt = computed(() => words.value.filter(w => w).join(' '))

const data = computed(() => Object.values(store.market?.data || {}))

watch(router.currentRoute, (value) => {
  if (value.path !== '/market') return
  const { keyword } = value.query
  if (keyword === prompt.value) return
  words.value = Array.isArray(keyword) ? keyword : (keyword || '').split(' ')
  if (words.value[words.value.length - 1]) words.value.push('')
}, { immediate: true, deep: true })

watch(prompt, (value) => {
  const { keyword: _, ...rest } = router.currentRoute.value.query
  if (value) {
    router.replace({ query: { keyword: value, ...rest } })
  } else {
    router.replace({ query: rest })
  }
}, { deep: true })

function handleClick(data: AnalyzedPackage) {
  active.value = data.name
}

const menu = computed(() => [refresh.value])

</script>

<style lang="scss">

.page-market .layout-main .el-scrollbar__view {
  padding: 0 var(--card-margin);
}

.page-market .layout-left {
  .market-filter-group {
    padding: 0 1.5rem;
    margin: 2rem 0;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    padding: 8px 0;
  }
}

.search-box {
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: var(--color-transition);
}

.market-hint {
  width: 100%;
  margin: 1rem 0 -0.5rem;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-primary);
  transition: color 0.3s ease;

  .el-checkbox {
    margin-left: 1.5rem;
  }
}

.market-container {
  .k-button {
    padding: 0.35em 0.85em;
    transform: translateY(-1px);
    margin-left: 1rem;
  }
}

.market-error.k-comment {
  margin-left: 2rem;
  margin-right: 2rem;
}

</style>
