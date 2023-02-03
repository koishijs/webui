<template>
  <k-layout main="darker" class="page-market" :menu="menu">
    <template #left>
      <market-filter v-model="words" :config="config" :data="all"></market-filter>
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
      <market-search v-model="words"></market-search>
      <div class="market-hint">
        共搜索到 {{ realWords.length ? packages.length + ' / ' : '' }}{{ all.length }} 个插件。
      </div>
      <div class="market-container">
        <market-package
          v-for="data in packages" :key="data.name" class="k-card"
          :data="data" :config="config" :gravatar="store.market.gravatar" @query="onQuery">
          <template #action v-if="store.packages">
            <k-button v-if="store.packages[data.name]" type="success" solid @click="handleClick(data)">修改</k-button>
            <k-button v-else :disabled="global.static" solid @click="handleClick(data)">添加</k-button>
          </template>
        </market-package>
      </div>
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
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { refresh, active } from '../utils'
import { useMarket, MarketFilter, MarketPackage, MarketSearch } from '@koishijs/client-market'
import { AnalyzedPackage } from '@koishijs/registry'

const route = useRoute()

const { keyword } = route.query

const { all, packages, words, config } = useMarket(() => Object.values(store.market.data), {
  isInstalled: (data) => !!store.packages[data.name],
})

words.value.splice(0, words.value.length, ...Array.isArray(keyword) ? keyword : (keyword || '').split(' '))
if (words.value[words.value.length - 1]) words.value.push('')

const realWords = computed(() => words.value.filter(w => w))

watch(words, () => {
  const { keyword: _, ...rest } = route.query
  const keyword = realWords.value.join(' ')
  if (keyword) {
    router.replace({ query: { keyword, ...rest } })
  } else {
    router.replace({ query: rest })
  }
}, { deep: true })

function onQuery(word: string) {
  if (!words.value[words.value.length - 1]) words.value.pop()
  if (!words.value.includes(word)) words.value.push(word)
  words.value.push('')
}

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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(336px, 1fr));
  gap: var(--card-margin);
  margin: var(--card-margin) 0;
  justify-items: center;

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
